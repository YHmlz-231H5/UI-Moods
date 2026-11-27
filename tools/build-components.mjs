#!/usr/bin/env node
// build-components — components/<id>/style.css  →  components/um-components.css
//
// The component layer used to be one hand-written file. That works until
// there are eighty components, at which point every addition is a merge
// conflict and every documentation page is a second, drifting copy of the
// stylesheet.
//
// So the stylesheet is now assembled from per-component partials, in the
// order the catalogue declares, and each component's manifest says what it
// paints. The build refuses to emit a stylesheet whose manifest and CSS
// disagree: a variant the manifest advertises but the CSS never paints is
// an error, not a surprise.

import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadManifests, catalogue, declaredClasses, modifierClass, partClass } from "./lib/manifest.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const componentsDir = join(root, "components");

const { manifests, problems } = loadManifests(root);
if (problems.length) {
  for (const p of problems) console.error(`manifest: ${p}`);
  console.log(`components: FAIL (${problems.length} errors)`);
  process.exit(1);
}

/** The class names a stylesheet actually defines. */
function classesIn(css) {
  const out = new Set();
  // A class selector, anywhere in the sheet — including inside a comma list.
  for (const m of css.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) out.add(m[1]);
  return out;
}

const chunks = [];

// The shared layers are files rather than components — they have no
// manifest and no documentation page. `_base.css` holds the layer constants
// and the shared focus and disabled treatment, so it comes first;
// `_hooks.css` holds the quality hooks, which sit on top of everything
// else, so it comes last. The position is not cosmetic: a rule that sets a
// property another rule also sets is resolved by order, and moving it would
// change what is painted.
const sharedFiles = readdirSync(componentsDir)
  .filter((f) => f.startsWith("_") && f.endsWith(".css"))
  .sort();
const first = sharedFiles.filter((f) => f === "_base.css");
const last = sharedFiles.filter((f) => f === "_hooks.css");
const middle = sharedFiles.filter((f) => !first.includes(f) && !last.includes(f));

for (const name of [...first, ...middle]) {
  chunks.push({
    id: name.replace(/\.css$/, ""),
    title: "shared layer",
    css: readFileSync(join(componentsDir, name), "utf8").trim(),
  });
}
if (!first.length) {
  console.error("components/_base.css missing — the shared layer has to exist");
  process.exit(1);
}

const perComponent = new Map();
const sharedText = chunks.map((c) => c.css).join("\n");

for (const m of manifests) {
  const stylePath = join(componentsDir, m.id, m.style);
  if (!existsSync(stylePath)) {
    problems.push(`components/${m.id}/${m.style} missing`);
    continue;
  }
  const css = readFileSync(stylePath, "utf8").trim();
  perComponent.set(m.id, css);
  chunks.push({ id: m.id, title: m.name, css });
}

// The quality hooks close the sheet.
for (const name of last) {
  chunks.push({
    id: name.replace(/\.css$/, ""),
    title: "quality hooks",
    css: readFileSync(join(componentsDir, name), "utf8").trim(),
  });
}

if (problems.length) {
  for (const p of problems) console.error(`components: ${p}`);
  console.log(`components: FAIL (${problems.length} errors)`);
  process.exit(1);
}

// --- the manifest and the stylesheet must agree --------------------------
const assembled = chunks.map((c) => c.css).join("\n\n");
const defined = classesIn(assembled);

for (const m of manifests) {
  const css = perComponent.get(m.id) ?? "";
  const own = classesIn(css);

  for (const cls of declaredClasses(m)) {
    if (!defined.has(cls)) {
      problems.push(`components/${m.id}: manifest declares "${cls}" but no stylesheet paints it`);
    }
  }
  for (const v of m.variants ?? []) {
    // A default variant is the base class itself and needs no modifier.
    if (v.default) continue;
    const cls = modifierClass(m, v.id);
    if (!own.has(cls)) {
      problems.push(`components/${m.id}: variant "${v.id}" (${cls}) is not in this component's CSS`);
    }
  }
  for (const s of m.sizes ?? []) {
    // Likewise the default size.
    if (s.default) continue;
    const cls = modifierClass(m, s.id);
    if (!own.has(cls)) {
      problems.push(`components/${m.id}: size "${s.id}" (${cls}) is not in this component's CSS`);
    }
  }
  for (const p of m.parts ?? []) {
    const cls = partClass(m, p.id);
    if (!own.has(cls)) {
      problems.push(`components/${m.id}: part "${p.id}" (${cls}) is not in this component's CSS`);
    }
  }
  for (const s of m.states ?? []) {
    if (!s.selector) continue;
    // A native state is written as a pseudo-class, so the check is for the
    // pseudo-class itself; a custom state is a class.
    const probe = s.selector.startsWith(".") ? s.selector.slice(1) : s.selector;
    // The focus and disabled treatments are shared: they live in the shared
    // layer, because every component answers to them the same way.
    if (!css.includes(probe) && !sharedText.includes(probe)) {
      problems.push(`components/${m.id}: state "${s.id}" (${s.selector}) is not painted anywhere`);
    }
  }
}

if (problems.length) {
  for (const p of problems) console.error(`components: ${p}`);
  console.log(`components: FAIL (${problems.length} errors)`);
  process.exit(1);
}

// --- emit -----------------------------------------------------------------
const header = [
  `/* ============================================================================`,
  `   ui-moods · component layer`,
  `   ----------------------------------------------------------------------------`,
  `   GENERATED by tools/build-components.mjs — do not edit.`,
  `  `,
  `   The source of truth is one file per component:`,
  `     components/<id>/manifest.json   the contract (variants, states, a11y)`,
  `     components/<id>/style.css       the styles`,
  `   and one shared layer, components/_base.css.`,
  `  `,
  `   Every value below is a var(--um-*). A theme file decides what those`,
  `   variables hold; this file never decides anything on its own.`,
  `   ========================================================================== */`,
  ``,
].join("\n");

writeFileSync(join(componentsDir, "um-components.css"), `${header}${chunks.map((c) => c.css).join("\n\n")}\n`, "utf8");
writeFileSync(
  join(componentsDir, "index.json"),
  JSON.stringify(catalogue(manifests), null, 2) + "\n",
  "utf8",
);

console.log(`components: ${manifests.length} components, ${chunks.length} chunks assembled`);
