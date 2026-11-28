// ui-moods · the mood-layer measurement, as a module.
//
// The mood layer — the thirty-two specimens and the fourteen app packs — is
// painted with `--mood-*` variables rather than with the component layer's
// roles, so it needs its own measurement. The component probe holds the
// library to the role contract; until this module existed, nothing was
// holding the mood layer to anything, and the documentation used to say an
// app pack "inherits its mood's contrast guarantees" and stop there.
//
// Two pages use this module:
//
//   apps.html    the fourteen app packs, screen by screen
//   moods.html   the thirty-two specimens, one per mood
//
// and the point of sharing it is the point of the contrast module's two
// pages: one measurement, two callers. A specimen and an app screen are
// built from the same templates, so they are measured by the same code — a
// defect that showed up in one and not the other would be a difference in
// the measuring, not in the page.
//
// The scope is text. The component probe also measures a short list of
// graphics — a spinner, a star, a progress bar — because those carry their
// meaning on their own. The mood layer has no equivalent list, and inventing
// one by rule ("every element with a background and no text") would flag every
// card on the page. A graphic that carries meaning in the mood layer is still
// unchecked; see docs/known-gaps.md.

export async function measureMoodPages(pages) {
  const rows = [];
  let measurements = 0;
  let unmeasurable = 0;
  let loaded = 0;

  for (const entry of pages) {
    const frame = await load(entry.html);
    const doc = frame.contentDocument;
    const win = frame.contentWindow;
    loaded++;

    for (const el of doc.querySelectorAll("*")) {
      const text = ownText(el);
      if (!text) continue;
      const style = win.getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") continue;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) continue;
      const fg = parse(style.color);
      if (!fg || fg.a === 0) continue;
      const bg = effectiveBackground(doc, el);
      if (!bg) {
        // Something with a gradient behind it: there is no single colour to
        // measure against, and pretending otherwise would report a white
        // heading on a dark artwork panel as white on white.
        unmeasurable++;
        continue;
      }
      const composite = fg.a < 1 ? over(fg, bg) : fg;
      const size = parseFloat(style.fontSize);
      const weight = parseInt(style.fontWeight, 10) || 400;
      const large = size >= 24 || (size >= 18.66 && weight >= 700);
      const need = isDisabled(el) ? 2 : large ? 3 : 4.5;
      const r = ratio(composite, bg);
      measurements++;
      if (r < need) {
        rows.push({
          group: entry.group,
          page: entry.page,
          element: el.tagName.toLowerCase() + "." + (el.className || "").toString().replace(/\s+/g, ".").slice(0, 60),
          fg: hex(composite),
          bg: hex(bg),
          ratio: Number(r.toFixed(2)),
          need,
          token: tokensFor(doc, composite),
          stack: bg.stack ?? "",
          owners: bg.owners ?? "",
          text: text.slice(0, 30),
        });
      }
    }
    frame.remove();
  }

  return { measurements, failures: rows.length, unmeasurable, pages: loaded, rows };
}

/** Load a document into an iframe and wait for it to settle. */
async function load(html) {
  const frames = document.getElementById("frames") ?? document.body;
  const frame = document.createElement("iframe");
  frames.append(frame);
  await new Promise((resolve) => {
    frame.onload = resolve;
    frame.srcdoc = html;
  });
  await new Promise((resolve) => requestAnimationFrame(resolve));
  return frame;
}

// --- colour maths (the same maths the component probe uses) --------------------

export function parse(value) {
  const s = String(value).trim();
  if (!s) return null;
  const m = s.match(/rgba?\(([^)]+)\)/);
  if (m) {
    const parts = m[1].split(/[\s,\/]+/).filter(Boolean).map(Number);
    return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
  }
  const h = s.match(/^#([0-9a-f]{3,8})$/i);
  if (h) {
    const digits = h[1].length <= 4 ? h[1].split("").map((c) => c + c).join("") : h[1];
    return {
      r: parseInt(digits.slice(0, 2), 16),
      g: parseInt(digits.slice(2, 4), 16),
      b: parseInt(digits.slice(4, 6), 16),
      a: digits.length >= 8 ? parseInt(digits.slice(6, 8), 16) / 255 : 1,
    };
  }
  return null;
}

export function over(fg, bg) {
  const a = fg.a;
  return { r: fg.r * a + bg.r * (1 - a), g: fg.g * a + bg.g * (1 - a), b: fg.b * a + bg.b * (1 - a), a: 1 };
}

function luminance({ r, g, b }) {
  const f = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

export function ratio(fg, bg) {
  const l1 = luminance(fg);
  const l2 = luminance(bg);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

export const hex = (c) =>
  "#" + [c.r, c.g, c.b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");

const rectIntersects = (a, b) =>
  a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

/** The canvas colour of a document: the body's background propagates to it. */
function canvasColor(doc) {
  const white = { r: 255, g: 255, b: 255, a: 1 };
  const html = parse(doc.defaultView.getComputedStyle(doc.documentElement).backgroundColor);
  if (html && html.a > 0) return over(html, white);
  const body = parse(doc.defaultView.getComputedStyle(doc.body).backgroundColor);
  if (body && body.a > 0) return over(body, white);
  return white;
}

/** The effective background of an element inside a document. */
export function effectiveBackground(doc, el) {
  const layers = [];
  const raws = [];
  const owners = [];
  let node = el;
  let rect = el.getBoundingClientRect();
  while (node && node.nodeType === 1 && node !== doc.body && node !== doc.documentElement) {
    const style = doc.defaultView.getComputedStyle(node);
    // A background image paints over the background colour, and a gradient is
    // not a colour: there is no single value to measure against.
    if (style.backgroundImage && style.backgroundImage !== "none") return null;
    const own = parse(style.backgroundColor);
    const box = node.getBoundingClientRect();
    // A clipping ancestor — a scroll box — holds its content inside its own
    // box: the content is painted over that background whether or not the
    // content's own rectangle reaches that far.
    const clips = style.overflowX !== "visible" || style.overflowY !== "visible";
    const behind = clips || box.width === 0 || box.height === 0 || rectIntersects(rect, box);
    if (own && own.a > 0 && behind) {
      layers.push(own);
      raws.push(style.backgroundColor);
      owners.push(node.tagName.toLowerCase() + "." + (node.className || "").toString().replace(/\s+/g, "."));
    }
    if (own && own.a >= 1) break;
    if (clips) rect = box;
    node = node.parentElement;
  }
  let result = canvasColor(doc);
  for (let i = layers.length - 1; i >= 0; i--) result = over(layers[i], result);
  // The stack is reported alongside the colour: a failure that names the
  // layers it was measured on can be traced back to the template rule that
  // painted them, and a colour on its own cannot. The raw strings are kept
  // because two translucent layers of the same tint flatten to the same
  // colour and are not the same layer, and the owners are kept because the
  // layer alone does not say which rule painted it.
  return { ...result, a: 1, stack: raws.join(" over "), owners: owners.join(" > ") };
}

function ownText(el) {
  let out = "";
  for (const node of el.childNodes) if (node.nodeType === 3) out += node.textContent;
  return out.trim();
}

/**
 * Which custom properties hold this colour?
 *
 * The mood layer paints with `--mood-*` variables, so a failing colour can be
 * traced back to the tokens that produced it. A colour can be held by more
 * than one token, and the stylesheet is what says which one was used — the
 * computed style cannot. So every candidate is listed: the list is the truth
 * the measurement can support, and picking one of them would be a guess.
 */
export function tokensFor(doc, colour) {
  const style = doc.defaultView.getComputedStyle(doc.documentElement);
  const found = [];
  for (let i = 0; i < style.length; i++) {
    const name = style[i];
    if (!name.startsWith("--mood-")) continue;
    const value = parse(style.getPropertyValue(name));
    if (!value || value.a === 0) continue;
    const flat = over(value, { r: 255, g: 255, b: 255, a: 1 });
    if (flat.r === colour.r && flat.g === colour.g && flat.b === colour.b) found.push(name);
  }
  return found.length ? found.join(" | ") : "(not a token)";
}

/**
 * A disabled control is exempt from the contrast rules; the layer still paints
 * it, and holds it to a bar of its own.
 *
 * What counts is the *state*, not the picture: a class that dims a day is not
 * a disabled day until the markup says so.
 *
 * The walk stops three levels up. A disabled control is exempt, but the
 * exemption belongs to the control and the label sitting next to it — not to
 * the page that happens to contain one. A walk that reached the page container
 * would drop the bar for every word on the page as soon as a single control
 * was disabled.
 */
function isDisabled(el) {
  let node = el;
  for (let depth = 0; node && node.nodeType === 1 && depth < 4; depth++) {
    if (node.disabled) return true;
    if (node.getAttribute && node.getAttribute("aria-disabled") === "true") return true;
    if (node.querySelector && node.querySelector(":disabled")) return true;
    node = node.parentElement;
  }
  return false;
}

/** The report a probe page writes into its table. */
export function renderReport(rows, columns) {
  const tbody = document.querySelector("#report tbody");
  for (const row of rows) {
    const tr = document.createElement("tr");
    tr.className = "fail";
    for (const key of columns) {
      const td = document.createElement("td");
      td.textContent = String(row[key]);
      tr.append(td);
    }
    tbody.append(tr);
  }
}

/** The summary line a probe page writes above its table. */
export function summarise(result, extra = []) {
  const byToken = new Map();
  for (const r of result.rows) {
    const entry = byToken.get(r.token) ?? { count: 0, worst: Infinity };
    entry.count++;
    entry.worst = Math.min(entry.worst, r.ratio);
    byToken.set(r.token, entry);
  }
  return (
    extra.map((line) => `${line}\n`).join("") +
    `pages: ${result.pages}\n` +
    `measurements: ${result.measurements}\n` +
    `unmeasurable (a gradient behind): ${result.unmeasurable}\n` +
    `failures: ${result.failures}\n` +
    (byToken.size
      ? "\nby token:\n" +
        [...byToken.entries()]
          .sort((a, b) => b[1].count - a[1].count)
          .map(([name, e]) => `  ${name}: ${e.count} failures, worst ${e.worst.toFixed(2)}`)
          .join("\n")
      : "")
  );
}
