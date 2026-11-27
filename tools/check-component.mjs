#!/usr/bin/env node
// UI Moods · single-component check.
//
//   node tools/check-component.mjs            # every component
//   node tools/check-component.mjs button tag # only these
//
// The whole-library check lives in `tools/validate.mjs`, and it reads the
// *assembled* stylesheet — which means it can only run after a build. That is
// the right order for a release and the wrong order while a component is
// being written: an author needs to know that the manifest and the stylesheet
// agree, that the stylesheet holds no literal, and that every variable it
// reads is a role some theme defines.
//
// This check answers exactly that, for the components it is given, and it
// touches nothing: no stylesheet is assembled, no catalogue is written, no
// theme is regenerated. Two authors can therefore run it on their own
// components at the same time without fighting over a shared file.
//
// It is the same rules the build enforces, minus the ones that need the
// whole library: a component cannot know whether *another* component paints a
// class it shares, and the assembly order is the builder's business.

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv from "ajv";
import { declaredClasses, modifierClass, partClass } from "./lib/manifest.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const componentsDir = join(root, "components");

const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, "");

/** The class names a stylesheet actually defines. */
function classesIn(css) {
  const out = new Set();
  for (const m of css.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) out.add(m[1]);
  return out;
}

/** The custom properties a stylesheet reads. */
function usedVars(css) {
  const out = new Set();
  for (const m of css.matchAll(/var\(\s*(--[a-z0-9-]+)/gi)) out.add(m[1]);
  return out;
}

function propertyValues(css, property) {
  const out = [];
  const re = new RegExp(`(?:^|[;{])\\s*${property}\\s*:\\s*([^;{}]+)`, "gi");
  for (const m of css.matchAll(re)) out.push(m[1].trim());
  return out;
}

const contract = JSON.parse(
  readFileSync(join(root, "tokens", "roles.json"), "utf8").replace(/^\uFEFF/, ""),
);
const allowlist = JSON.parse(
  readFileSync(join(root, "schemas", "component-allowlist.json"), "utf8").replace(/^\uFEFF/, ""),
);
const schema = JSON.parse(
  readFileSync(join(root, "schemas", "component.schema.json"), "utf8").replace(/^\uFEFF/, ""),
);

const prefix = contract.prefix ?? "--um";
const roleVars = new Set(
  Object.keys(contract.roles ?? {}).map((r) => `${prefix}-${r}`),
);
const constantVars = new Set(
  Object.keys(contract.componentConstants ?? {}).filter((k) => k.startsWith("--")),
);
const knownVars = new Set([...roleVars, ...constantVars]);

// The shared layers answer for the focus and disabled treatments of every
// component, so a state selector may legitimately live there.
const sharedText = ["_base.css", "_hooks.css"]
  .map((name) => {
    const path = join(componentsDir, name);
    return existsSync(path) ? readFileSync(path, "utf8") : "";
  })
  .join("\n");
const sharedClasses = classesIn(sharedText);

const ajv = new Ajv({ strict: false, allErrors: true });
const validate = ajv.compile(schema);

const asked = process.argv.slice(2).filter((a) => !a.startsWith("-"));

/** Every component on disk. The catalogue is not the source here: a component
 * being written has not been assembled into it yet. */
const allIds = readdirSync(componentsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .filter((name) => existsSync(join(componentsDir, name, "manifest.json")))
  .sort();
if (!allIds.length) {
  console.error("no component manifests found under components/");
  process.exit(1);
}

const ids = asked.length ? asked : allIds;
const unknown = ids.filter((id) => !allIds.includes(id));
if (unknown.length) {
  console.error(`unknown component(s): ${unknown.join(", ")}`);
  process.exit(1);
}

let failed = 0;

for (const id of ids) {
  const problems = [];
  const manifestPath = join(componentsDir, id, "manifest.json");
  if (!existsSync(manifestPath)) {
    console.error(`${id}: manifest.json missing`);
    failed++;
    continue;
  }

  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, "utf8").replace(/^\uFEFF/, ""));
  } catch (e) {
    console.error(`${id}: manifest.json is not valid JSON — ${e.message}`);
    failed++;
    continue;
  }

  if (manifest.id !== id) {
    problems.push(`manifest declares id "${manifest.id}"`);
  }
  if (!validate(manifest)) {
    for (const e of validate.errors ?? []) {
      problems.push(`manifest ${e.instancePath || "/"} ${e.message}`);
    }
    console.error(`${id}: FAIL`);
    for (const p of problems) console.error(`  ${p}`);
    failed++;
    continue;
  }

  const stylePath = join(componentsDir, id, manifest.style ?? "style.css");
  if (!existsSync(stylePath)) {
    problems.push(`${manifest.style ?? "style.css"} missing`);
    console.error(`${id}: FAIL`);
    for (const p of problems) console.error(`  ${p}`);
    failed++;
    continue;
  }
  const raw = readFileSync(stylePath, "utf8");
  const css = stripComments(raw);
  const own = classesIn(css);

  // --- the manifest and the stylesheet must agree --------------------------
  // A class the manifest declares may be painted by the shared layers: the
  // quality hooks hold the treatments that belong to the component but not to
  // its own partial — `.um-button--glow` is the button's, the rule is the
  // hook's.
  const painted = (cls) => own.has(cls) || sharedClasses.has(cls);
  for (const cls of declaredClasses(manifest)) {
    if (!painted(cls)) {
      problems.push(`manifest declares "${cls}" but no stylesheet paints it`);
    }
  }
  for (const v of manifest.variants ?? []) {
    if (v.default) continue;
    const cls = modifierClass(manifest, v.id);
    if (!own.has(cls)) problems.push(`variant "${v.id}" (${cls}) is not in this stylesheet`);
  }
  for (const s of manifest.sizes ?? []) {
    if (s.default) continue;
    const cls = modifierClass(manifest, s.id);
    if (!own.has(cls)) problems.push(`size "${s.id}" (${cls}) is not in this stylesheet`);
  }
  for (const p of manifest.parts ?? []) {
    const cls = partClass(manifest, p.id);
    if (!own.has(cls)) problems.push(`part "${p.id}" (${cls}) is not in this stylesheet`);
  }
  for (const s of manifest.states ?? []) {
    if (!s.selector) continue;
    const probe = s.selector.startsWith(".") ? s.selector.slice(1) : s.selector;
    if (!css.includes(probe) && !sharedText.includes(probe)) {
      problems.push(`state "${s.id}" (${s.selector}) is not painted anywhere`);
    }
  }

  // --- no literal in the component layer ----------------------------------
  for (const m of css.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) {
    problems.push(`colour literal ${m[0]}; use var(--um-*)`);
  }
  for (const m of css.matchAll(/\brgba?\([^)]*\)/gi)) {
    problems.push(`colour literal ${m[0]}; use var(--um-*)`);
  }
  for (const value of propertyValues(css, "border-radius")) {
    const bare = value.replace(/var\(--um-[a-z0-9-]+\)/g, "").trim();
    if (bare && bare !== "0" && bare !== "50%") {
      problems.push(`border-radius: ${value}; use var(--um-radius-*)`);
    }
  }
  for (const value of propertyValues(css, "font-size")) {
    if (!/^var\(--um-font-size-[a-z0-9-]+\)$/.test(value)) {
      problems.push(`font-size: ${value}; use var(--um-font-size-*)`);
    }
  }
  const allowedPx = new Set(allowlist.px ?? []);
  for (const m of css.matchAll(/(-?\d+(?:\.\d+)?)px/g)) {
    if (!allowedPx.has(m[1])) {
      problems.push(`${m[0]} literal; add it to schemas/component-allowlist.json with a reason`);
    }
  }

  // --- every variable read has to be a role a theme defines ---------------
  // A component may own a variable of its own, as long as it is namespaced
  // under this component's id and the stylesheet declares it.
  const declared = new Set();
  for (const m of raw.matchAll(/(--[a-z0-9-]+)\s*:/gi)) declared.add(m[1]);
  for (const v of usedVars(css)) {
    if (knownVars.has(v)) continue;
    if (v.startsWith(`${prefix}-${id}-`) && declared.has(v)) continue;
    problems.push(`reads ${v}, which no theme defines`);
  }

  if (problems.length) {
    failed++;
    console.error(`${id}: FAIL (${problems.length})`);
    for (const p of problems) console.error(`  ${p}`);
  } else {
    console.log(`${id}: PASS`);
  }
}

console.log(
  failed
    ? `check-component: FAIL (${failed} of ${ids.length} components failed)`
    : `check-component: PASS (${ids.length} components)`,
);
process.exit(failed ? 1 : 0);
