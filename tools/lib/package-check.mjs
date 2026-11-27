// UI Moods · is the package actually usable by a host?
//
// Every other check in this repository asks whether the library is *correct*:
// the manifests agree with the stylesheet, the stylesheet agrees with the
// theme files, the wrappers agree with the manifests. This one asks a
// different question, and the one that matters to somebody who wants to use
// the library in their own system:
//
//   If I `npm install ui-moods` and import things by the documented names,
//   do I get the right files, and do they render?
//
// So it does not re-implement the resolver. It uses Node's own —
// `import.meta.resolve`, resolving the package by its own name, which is the
// self-reference feature of the `exports` field — and checks that every
// public name lands on a file that exists. Then it imports the Vue package
// through that same public name and renders a component with the server
// renderer, because a package whose entry points resolve but whose components
// do not render is still broken.
//
// The CSS is checked the same way: the file in `css/` has to be the file the
// build would write, byte for byte, or a host that links it is linking
// something that has drifted from the library.

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { assembleChunks, joinChunks } from "./component-chunks.mjs";

/**
 * Check the package.
 *
 * @param {string} root the repository root
 * @returns {Promise<{ problems: string[], skipped: string[], stats: object }>}
 */
export async function checkPackage(root) {
  const problems = [];
  const skipped = [];
  const note = (m) => problems.push(m);

  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8").replace(/^\uFEFF/, ""));

  // --- 1. every public name resolves to a file that exists ------------------

  const { chunks, manifests } = assembleChunks(root);
  const themeIndex = JSON.parse(
    readFileSync(join(root, "themes", "index.json"), "utf8").replace(/^\uFEFF/, ""),
  );
  const themeIds = (themeIndex.themes ?? []).map((t) => t.id);

  /** The specifiers a host is told to use. */
  const specifiers = [
    "ui-moods/vue",
    "ui-moods/types",
    "ui-moods/css/base.css",
    "ui-moods/css/all.css",
    "ui-moods/components/um-components.css",
    "ui-moods/themes/all.css",
    "ui-moods/themes/switcher",
    "ui-moods/themes/index.json",
    ...manifests.map((m) => `ui-moods/vue/${m.id}`),
    ...manifests.map((m) => `ui-moods/css/${m.id}.css`),
    ...themeIds.map((id) => `ui-moods/themes/${id}.css`),
  ];

  const resolved = new Map();
  for (const spec of specifiers) {
    let url;
    try {
      url = import.meta.resolve(spec);
    } catch (e) {
      note(`exports: "${spec}" does not resolve — ${e.code ?? e.message}`);
      continue;
    }
    if (!url.startsWith("file:")) continue;
    const path = fileURLToPath(url);
    resolved.set(spec, path);
    if (!existsSync(path)) {
      note(`exports: "${spec}" resolves to ${path}, which does not exist`);
    }
  }

  // --- 2. every public file is inside a directory the package publishes ------

  // A file that resolves but is not in `files` is a file that works in the
  // repository and is missing from the tarball. That is the difference between
  // a package that works here and a package that works for a consumer.
  const published = pkg.files ?? [];
  const publishedRoots = published
    .filter((f) => !f.includes("*"))
    .map((f) => f.replace(/\/$/, ""));
  const publishedGlobs = published.filter((f) => f.includes("*"));

  for (const [spec, path] of resolved) {
    const rel = path.slice(root.length + 1).replace(/\\/g, "/");
    const top = rel.split("/")[0];
    const inFiles =
      publishedRoots.includes(top) ||
      publishedRoots.includes(`${top}/`) ||
      publishedGlobs.some((g) => {
        // `moods/*/tokens.json` — the file has to match the glob's shape.
        const re = new RegExp(
          "^" +
            g
              .replace(/[.+^${}()|[\]\\]/g, "\\$&")
              .replace(/\*/g, "[^/]*")
              .replace(/\//g, "\\/") +
            "$",
        );
        return re.test(rel);
      });
    if (!inFiles) {
      note(`package: "${spec}" resolves to ${rel}, which package.json "files" does not publish`);
    }
  }

  // --- 3. the CSS in css/ is the CSS the build writes -------------------------

  const stripHeader = (css) => css.replace(/^\/\*[\s\S]*?\*\/\s*/, "");

  const shared = chunks.filter(
    (c) => c.kind === "shared" || c.kind === "box-model" || c.kind === "motion",
  );
  const hooks = chunks.filter((c) => c.kind === "hooks");
  const components = chunks.filter((c) => c.kind === "component");

  const cssDir = join(root, "css");
  if (!existsSync(cssDir)) {
    note("css/ missing — run `ui-moods build-dist`");
  } else {
    const basePath = join(cssDir, "base.css");
    if (!existsSync(basePath)) {
      note("css/base.css missing — run `ui-moods build-dist`");
    } else {
      const base = stripHeader(readFileSync(basePath, "utf8"));
      const expectedBase = `${shared.map((c) => c.css).join("\n\n")}\n`;
      if (base !== expectedBase) {
        note("css/base.css is out of date — run `ui-moods build-dist`");
      }
    }

    for (const c of components) {
      const path = join(cssDir, `${c.id}.css`);
      if (!existsSync(path)) {
        note(`css/${c.id}.css missing — run \`ui-moods build-dist\``);
        continue;
      }
      const body = stripHeader(readFileSync(path, "utf8"));
      const expected = `${[c.css, ...hooks.map((h) => h.css)].join("\n\n")}\n`;
      if (body !== expected) {
        note(`css/${c.id}.css is out of date — run \`ui-moods build-dist\``);
      }
    }

    const allPath = join(cssDir, "all.css");
    if (!existsSync(allPath)) {
      note("css/all.css missing — run `ui-moods build-dist`");
    } else {
      const body = stripHeader(readFileSync(allPath, "utf8"));
      if (body !== `${joinChunks(chunks)}\n`) {
        note("css/all.css is out of date — run `ui-moods build-dist`");
      }
    }
  }

  // --- 4. the whole sheet and the split sheet say the same thing -------------

  const wholePath = join(root, "components", "um-components.css");
  if (existsSync(wholePath)) {
    const whole = stripHeader(readFileSync(wholePath, "utf8"));
    if (whole !== `${joinChunks(chunks)}\n`) {
      note("components/um-components.css is out of date — run `ui-moods build-components`");
    }
  }

  // --- 5. the library renders, through the package's own public name ----------

  // The Vue package is imported by the name a consumer would type, not by a
  // relative path, so this exercises the exports map as well as the components.
  //
  // Vue is a peer dependency and an optional one: a consumer who wants the
  // plain CSS does not install it. So a missing Vue is a skip, not a failure —
  // the same way `validate` skips the type check when TypeScript is absent.
  let vue = null;
  try {
    vue = await import("vue");
  } catch {
    skipped.push("vue is not installed — the Vue half of the package was not exercised");
  }

  if (vue) {
    try {
      const { renderToString } = await import("@vue/server-renderer");
      const um = await import("ui-moods/vue");

      const app = vue.createSSRApp({
        render() {
          return vue.h("div", [
            vue.h(um.UMButton, { variant: "primary" }, () => "OK"),
            vue.h(um.UMTag, { variant: "success" }, () => "done"),
          ]);
        },
      });
      const html = await renderToString(app);

      if (!html.includes("um-button")) note("vue: the rendered button has no um-button class");
      if (!html.includes("um-button--primary")) {
        note("vue: the rendered button has no um-button--primary class");
      }
      if (!html.includes("um-tag")) note("vue: the rendered tag has no um-tag class");

      // Every component in the barrel has to be a real Vue component, not a
      // placeholder: the barrel is generated, and a generation slip would show
      // up here rather than in a consumer's template.
      const names = Object.keys(um.components ?? {});
      if (names.length !== manifests.length) {
        note(`vue: the barrel holds ${names.length} components, the manifests describe ${manifests.length}`);
      }
      for (const [name, component] of Object.entries(um.components ?? {})) {
        if (!component || typeof component !== "object" || !component.setup) {
          note(`vue: ${name} is not a component`);
        }
      }
    } catch (e) {
      note(`vue: the package could not be imported through its public name — ${e.message}`);
    }
  }

  // --- 6. the switcher installs itself, and survives an import with no DOM ----

  // The switcher is the one piece of JavaScript the library ships, and it is
  // browser code: it needs a document. Two things have to hold.
  //
  //   - Importing it where there is no document must not throw. The package is
  //     `"type": "module"`, so a bundler that pulls this file into a
  //     server-rendered page would otherwise take the bundle down on a
  //     `document` of `undefined`.
  //   - Given a document, it must install a working switcher: set a mood,
  //     refuse a mood that does not exist, and announce the change.
  //
  // The second is checked in a sandbox rather than a browser, because the
  // switcher only touches four things on the global — the document element, the
  // storage, the location and `addEventListener` — and a sandbox that says so
  // is a smaller claim than "it works in a browser" and a bigger claim than
  // "it parses".
  try {
    const vm = await import("node:vm");
    const switcherPath = join(root, "themes", "switcher.js");
    const code = readFileSync(switcherPath, "utf8");

    // A document, just enough of one.
    const attributes = new Map();
    const events = [];
    const element = {
      getAttribute: (n) => (attributes.has(n) ? attributes.get(n) : null),
      setAttribute: (n, v) => attributes.set(n, v),
      dispatchEvent: (e) => events.push(e),
    };
    const stored = new Map();
    const fake = {
      document: { documentElement: element, currentScript: null },
      addEventListener: () => {},
      removeEventListener: () => {},
      localStorage: {
        getItem: (k) => (stored.has(k) ? stored.get(k) : null),
        setItem: (k, v) => stored.set(k, v),
      },
      location: { search: "" },
      fetch: async () => ({ json: async () => ({ themes: [] }) }),
      UM_THEMES: { all: ["aurora", "night"], light: ["aurora"], dark: ["night"] },
      // A sandbox has no DOM globals of its own, so the one the switcher
      // announces through is handed in. Node has had `CustomEvent` since v19.
      CustomEvent: globalThis.CustomEvent,
    };
    fake.window = fake;

    const sandbox = vm.createContext(fake);
    vm.runInContext(code, sandbox);

    if (typeof fake.UMTheme?.set !== "function") {
      note("themes/switcher: no UMTheme.set");
    } else {
      if (fake.UMTheme.set("night") !== "night") {
        note("themes/switcher: set() did not apply a mood that exists");
      }
      if (element.getAttribute("data-um-theme") !== "night") {
        note("themes/switcher: set() did not write the attribute the cascade reads");
      }
      if (fake.UMTheme.set("no-such-mood") !== "night") {
        note("themes/switcher: set() accepted a mood that does not exist");
      }
      if (!events.some((e) => e?.detail?.theme === "night")) {
        note("themes/switcher: set() did not announce the change");
      }
      if (stored.get("um-theme") !== "night") {
        note("themes/switcher: set() did not remember the mood");
      }
    }

    // And the same file, imported where there is no document at all.
    try {
      await import(pathToFileURL(switcherPath).href);
    } catch (e) {
      note(`themes/switcher: importing it without a document threw — ${e.message}`);
    }
  } catch (e) {
    note(`themes/switcher: could not be checked — ${e.message}`);
  }

  return {
    problems,
    skipped,
    stats: {
      resolved: resolved.size,
      components: manifests.length,
      themes: themeIds.length,
    },
  };
}
