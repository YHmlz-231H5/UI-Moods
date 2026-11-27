#!/usr/bin/env node
// ui-moods · the rendered audit, as a command.
//
//   node tools/audit-render.mjs            # the component layer
//   node tools/audit-render.mjs apps       # the app packs
//   node tools/audit-render.mjs --json report.json
//
// `audit-contrast` reads the token contract and computes what it promises.
// This one asks the browser instead: it loads the built library into a
// headless browser, walks it once per mood, and reports the colours the
// browser actually painted. A promise the rendering breaks is not a promise,
// so the two have to agree — and only a browser can say what was painted.
//
// The measurement is not re-implemented here. The probe pages under
// `tools/probe/` are the instrument; this drives the page in a headless
// browser and reads the result the page publishes as `window.__PROBE__`. A
// person can open the same page in a browser and get the same table.
//
// The browser is driven over the DevTools protocol rather than by dumping
// the DOM at the end: the probes are long chains of awaits, and the only
// reliable way to know that a chain finished is to be told. A dump taken at
// an arbitrary moment is a reading of a page that was still working.
//
// The exit code is the verdict: 0 when the probe reported nothing, 1 when it
// did, 2 when the run itself went wrong. So the audit can be a step in a
// pipeline rather than a ritual.

import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import net from "node:net";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/** The probes this command knows how to drive. */
const PROBES = {
  contrast: { page: "contrast.html", title: "component layer" },
  geometry: { page: "geometry.html", title: "component layout" },
  motion: { page: "motion.html", title: "the motion contract" },
  package: { page: "package.html", title: "the published package" },
  validity: { page: "validity.html", title: "the rules the browser kept" },
  state: { page: "state.html", title: "the states the reader sees" },
  rtl: { page: "rtl.html", title: "the reading direction" },
  apps: { page: "apps.html", title: "app packs" },
};

const args = process.argv.slice(2);
const positional = args.filter((a) => !a.startsWith("--"));
const valueOf = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};

const which = positional[0] ?? "contrast";
if (!PROBES[which]) {
  console.error(`audit-render: unknown probe "${which}" (known: ${Object.keys(PROBES).join(", ")})`);
  process.exit(2);
}

// --- the browser -------------------------------------------------------------

/**
 * Where a headless browser might be.
 *
 * The probe needs a real browser: it measures what the browser painted, and
 * a JavaScript re-implementation of the cascade would measure what this file
 * believes the cascade does. So the browser is found rather than emulated.
 */
function findChrome() {
  const named = valueOf("chrome") ?? process.env.CHROME_PATH;
  if (named) {
    if (!existsSync(named)) {
      console.error(`audit-render: no browser at ${named}`);
      process.exit(2);
    }
    return named;
  }
  const candidates = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    join(process.env.LOCALAPPDATA ?? "", "Google", "Chrome", "Application", "chrome.exe"),
    join(process.env.PROGRAMFILES ?? "", "Microsoft", "Edge", "Application", "msedge.exe"),
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ];
  for (const c of candidates) if (c && existsSync(c)) return c;
  return null;
}

// --- the preview server -----------------------------------------------------

/** A port nothing is listening on. */
function freePort() {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.on("error", reject);
    s.listen(0, "127.0.0.1", () => {
      const { port } = s.address();
      s.close(() => resolve(port));
    });
  });
}

/** Wait until the preview server answers. */
async function waitForServer(url, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 120));
  }
  throw new Error(`the preview server did not answer at ${url}`);
}

// --- the browser, over the DevTools protocol --------------------------------

/**
 * Start the browser and wait for it to announce its DevTools endpoint.
 *
 * The browser writes the endpoint on stderr as soon as it is listening. The
 * port is not fixed: the browser picks one and writes it down, which is the
 * only way to run several of these at once without them fighting over a
 * port.
 */
function launchBrowser(chrome, url, profileDir) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      chrome,
      [
        "--headless=new",
        "--disable-gpu",
        "--no-sandbox",
        "--no-first-run",
        "--no-default-browser-check",
        "--hide-scrollbars",
        "--disable-extensions",
        "--disable-dev-shm-usage",
        // Without this the headless browser produces no frames of its own,
        // and `requestAnimationFrame` never fires — the app probe waits for
        // one to settle each screen it loads, so it would sit there for ever.
        "--run-all-compositor-stages-before-draw",
        "--remote-debugging-port=0",
        `--user-data-dir=${profileDir}`,
        url,
      ],
      { stdio: ["ignore", "pipe", "pipe"] },
    );

    let stderr = "";
    let settled = false;
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
      const m = stderr.match(/DevTools listening on (ws:\/\/\S+)/);
      if (m && !settled) {
        settled = true;
        resolve({ child, browserWs: m[1] });
      }
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (!settled) {
        settled = true;
        reject(new Error(`the browser exited with code ${code}\n${stderr.trim().slice(0, 1500)}`));
      }
    });
  });
}

/** A very small DevTools client: one socket, one request at a time. */
function connect(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let nextId = 1;
    const pending = new Map();

    ws.addEventListener("message", (event) => {
      const msg = JSON.parse(event.data);
      const waiter = pending.get(msg.id);
      if (!waiter) return;
      pending.delete(msg.id);
      if (msg.error) waiter.reject(new Error(msg.error.message));
      else waiter.resolve(msg.result);
    });
    ws.addEventListener("error", () => reject(new Error(`the DevTools socket failed`)));
    ws.addEventListener("close", () => {
      for (const waiter of pending.values()) waiter.reject(new Error("the DevTools socket closed"));
      pending.clear();
    });

    const send = (method, params = {}) =>
      new Promise((res, rej) => {
        const id = nextId++;
        pending.set(id, { resolve: res, reject: rej });
        ws.send(JSON.stringify({ id, method, params }));
      });

    ws.addEventListener("open", () => resolve({ send, close: () => ws.close() }));
  });
}

/** The DevTools port, read back out of the browser's own endpoint. */
function devtoolsPort(wsUrl) {
  return new URL(wsUrl).port;
}

/** One failure, written as a line a person can act on. */
function describe(row) {
  // The geometry probe reports a check and a sentence; the contrast probes
  // report a pair of colours and a ratio.
  if (row.detail) return `${row.theme ?? ""}  ${row.element} — ${row.detail}`;
  const parts = [
    row.theme ?? row.screen ?? "",
    row.element ?? "",
    `${row.ratio}<${row.need}`,
    `${row.fg} on ${row.bg}`,
  ];
  if (row.token) parts.push(row.token);
  if (row.text) parts.push(`"${row.text}"`);
  return parts.filter(Boolean).join("  ");
}

/**
 * The page the probe is running in.
 *
 * The browser opens the page it was given, but it opens it a moment after it
 * starts, so the first listing may still show a blank page. The listing is
 * therefore polled until the probe's own URL shows up.
 */
async function findProbePage(port, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const list = await fetch(`http://127.0.0.1:${port}/json/list`).then((r) => r.json());
      const page = list.find((t) => t.type === "page" && t.url.includes("/probe/")) ?? null;
      if (page?.webSocketDebuggerUrl) return page;
    } catch {
      // the DevTools http server may not be up yet
    }
    await new Promise((r) => setTimeout(r, 120));
  }
  throw new Error("the browser opened no page to measure");
}

/**
 * Send a command, retrying while the page is still settling.
 *
 * The browser replaces the page's execution context when it navigates, and a
 * command that arrives in the middle of that swap is answered with "context
 * was destroyed" — which is a timing accident, not a failure, so it is
 * retried rather than reported.
 */
async function sendWithRetry(client, method, params, attempts = 60) {
  let last;
  for (let i = 0; i < attempts; i++) {
    try {
      return await client.send(method, params);
    } catch (e) {
      last = e;
      if (!/context was destroyed|Cannot find context|target (closed|navigated)/i.test(e.message)) throw e;
      await new Promise((r) => setTimeout(r, 250));
    }
  }
  throw last;
}

/** Wait until the page has finished loading and can be asked questions. */
async function waitUntilReady(client, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const r = await sendWithRetry(client, "Runtime.evaluate", {
        expression: "document.readyState",
        returnByValue: true,
      });
      if (r.result?.value === "complete") return;
    } catch {
      // the context is still being replaced
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error("the probe page never finished loading");
}

/**
 * Wait for the probe to publish its result, then read it.
 *
 * The probe writes `window.__PROBE__` as its last act. Polling for that
 * object is how the run is known to be finished — and how a run that never
 * finishes is known not to have finished.
 */
const AWAIT_PROBE = `new Promise((resolve) => {
  const tick = () => {
    if (window.__PROBE__) {
      resolve(JSON.stringify(window.__PROBE__));
      return;
    }
    setTimeout(tick, 150);
  };
  tick();
})`;

// --- the run -----------------------------------------------------------------

const chrome = findChrome();
if (!chrome) {
  console.error(
    "audit-render: no Chrome or Edge found. Set CHROME_PATH to a browser, or pass --chrome <path>.",
  );
  process.exit(2);
}

const port = Number(valueOf("port") ?? (await freePort()));
const server = spawn(process.execPath, [join(root, "tools", "serve.mjs"), String(port)], {
  stdio: ["ignore", "pipe", "pipe"],
});
const profileDir = mkdtempSync(join(tmpdir(), "um-audit-"));

// The reading direction, when the probe takes one.
//
// A library that claims to fit a reader's system has to work in the reader's
// direction too, and the only way to know is to render it in that direction
// and measure. The direction is handed to the page as a query parameter
// rather than as an emulated media feature, because it is a property of the
// document, not of the reader's system.
const dir = valueOf("dir");

const cleanup = () => {
  try {
    server.kill();
  } catch {
    // it may already be gone
  }
  try {
    rmSync(profileDir, { recursive: true, force: true });
  } catch {
    // a profile left behind in the temp directory is not worth failing over
  }
};

let exitCode = 1;
let browser = null;
try {
  const base = `http://127.0.0.1:${port}`;
  await waitForServer(`${base}/index.html`);
  const query = dir ? `?dir=${encodeURIComponent(dir)}` : "";
  const url = `${base}/probe/${PROBES[which].page}${query}`;

  browser = await launchBrowser(chrome, url, profileDir);

  // The browser's own endpoint lists the pages it has open; the probe is the
  // one whose URL is the page we asked for.
  const page = await findProbePage(devtoolsPort(browser.browserWs));
  if (!page?.webSocketDebuggerUrl) throw new Error("the browser opened no page to measure");

  const client = await connect(page.webSocketDebuggerUrl);
  await sendWithRetry(client, "Runtime.enable");

  // Tell the browser what the reader has asked for.
  //
  // The motion contract only holds when the reader has actually asked for
  // reduced motion, and a browser on a machine that has not asked for it
  // cannot be talked out of the question — the preference has to be emulated
  // at the browser's level, where the media query reads it.
  if (args.includes("--reduced-motion")) {
    await sendWithRetry(client, "Emulation.setEmulatedMedia", {
      media: "",
      features: [{ name: "prefers-reduced-motion", value: "reduce" }],
    });
  }

  await waitUntilReady(client);

  const budgetMs = Number(valueOf("timeout") ?? 600000);
  const evaluated = await sendWithRetry(client, "Runtime.evaluate", {
    expression: AWAIT_PROBE,
    awaitPromise: true,
    returnByValue: true,
    timeout: budgetMs,
  });

  if (evaluated.exceptionDetails) {
    throw new Error(
      `the probe threw — ${evaluated.exceptionDetails.exception?.description ?? evaluated.exceptionDetails.text}`,
    );
  }

  const report = JSON.parse(evaluated.result.value);
  const rows = report.rows ?? [];
  const failures = report.failures ?? rows.length;
  const measured = report.measurements ?? 0;

  console.log(`audit-render · ${PROBES[which].title} · ${which}`);
  if (dir) console.log(`  reading direction: ${dir}`);
  console.log(`  measurements: ${measured}`);
  console.log(`  failures: ${failures}`);
  if (report.unmeasurable !== undefined) console.log(`  unmeasurable: ${report.unmeasurable}`);
  if (report.screens !== undefined) console.log(`  screens: ${report.screens}`);
  // The motion probe reports what the reader asked for and how much the
  // library would have moved without being asked — the baseline is what makes
  // the reduced-motion number mean something.
  if (report.reduced !== undefined) {
    console.log(`  reader asked for reduced motion: ${report.reduced}`);
    console.log(`  elements with a declared duration: ${report.timed}`);
    console.log(`  elements that visibly move: ${report.moving}`);
  }

  if (rows.length) {
    // Grouped by the second column: that is the component (or the app
    // screen), and one component's failure is one thing to go and look at.
    const groups = new Map();
    for (const r of rows) {
      const key = r.component ?? r.app ?? "?";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(r);
    }
    console.log("");
    for (const [key, list] of groups) {
      console.log(`  ${key} — ${list.length} row${list.length === 1 ? "" : "s"}`);
      for (const r of list.slice(0, 8)) console.log(`    ${describe(r)}`);
      if (list.length > 8) console.log(`    … and ${list.length - 8} more`);
    }
  }

  const jsonPath = valueOf("json");
  if (jsonPath) {
    writeFileSync(jsonPath, JSON.stringify({ probe: which, ...report }, null, 2));
    console.log(`\n  report written to ${jsonPath}`);
  }

  exitCode = failures > 0 ? 1 : 0;
} catch (e) {
  console.error(`audit-render: ${e.message}`);
  exitCode = 2;
} finally {
  if (browser) {
    try {
      browser.child.kill();
    } catch {
      // it may already be gone
    }
  }
  cleanup();
}

process.exit(exitCode);

