#!/usr/bin/env node
// ui-moods validate — mood package checks (schema, references, token-only,
// contrast, magic numbers). Semantics documented in docs/schema-checklist.md.

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv from "ajv";
import yaml from "js-yaml";
import { expectedVars, FALLBACK_ALLOWED } from "./lib/mapping.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ajv = new Ajv({ strict: false, allErrors: true });

const tokensSchema = JSON.parse(readFileSync(join(root, "schemas", "tokens.schema.json"), "utf8"));
const checklistSchema = JSON.parse(readFileSync(join(root, "schemas", "checklist.schema.json"), "utf8"));
const validateTokensSchema = ajv.compile(tokensSchema);
const validateChecklistSchema = ajv.compile(checklistSchema);

// --- allowlists (docs/css-var-mapping.md §5) ---
const ALLOWED_FONT_SIZES = new Set([10, 11, 12, 13]);
const ALLOWED_LETTER_SPACING = new Set([0.06, 0.08, 0.1, 0.12]);
const ALLOWED_OPACITY = new Set([0.4, 0.45, 0.6, 0.7, 0.75]);
const ALLOWED_PX = new Set([
  0, 3, 4, 6, 8, 9, 10, 12, 14, 16, 18, 20, 21, 24, 28, 36, 42, 44, 48, 72, 76, 640, 860, 999,
]);
const COLOR_KEYWORDS = new Set(["transparent", "currentColor", "inherit", "none"]);
const COMPONENT_KEYWORDS = new Set(["transparent", "none", "currentColor", "inherit", "0"]);

const REF_RE = /^\{([a-zA-Z][a-zA-Z0-9_]*)\.([a-zA-Z][a-zA-Z0-9_]*)\}$/;

function loadJson(path) {
  return JSON.parse(readFileSync(path, "utf8").replace(/^\uFEFF/, ""));
}

function loadYaml(path) {
  return yaml.load(readFileSync(path, "utf8").replace(/^\uFEFF/, ""));
}

function resolvePath(obj, path) {
  let cur = obj;
  for (const part of path.split(".")) {
    if (cur === null || typeof cur !== "object") return undefined;
    cur = cur[part];
  }
  return cur;
}

function resolveRef(tokens, ref) {
  const m = REF_RE.exec(ref);
  if (!m) return { ok: false, reason: `malformed reference "${ref}"` };
  const value = tokens[m[1]]?.[m[2]];
  if (value === undefined) return { ok: false, reason: `reference "${ref}" does not resolve` };
  return { ok: true, value };
}

function formatSchemaErrors(errors) {
  return (errors || [])
    .map((e) => `${e.instancePath || "/"}: ${e.message}`)
    .join("; ");
}

// --- token-only: components ---
function checkComponents(tokens, errors) {
  const comp = tokens.components;
  if (comp === undefined) return;
  const walk = (node, path) => {
    if (node === null || typeof node !== "object") {
      if (typeof node === "string") {
        if (node.startsWith("{") && node.endsWith("}")) {
          const r = resolveRef(tokens, node);
          if (!r.ok) errors.push(`${path}: ${r.reason}`);
        } else if (!COMPONENT_KEYWORDS.has(node)) {
          errors.push(`${path}: literal "${node}" not in component keyword whitelist`);
        }
      } else if (typeof node === "number") {
        if (node !== 0) errors.push(`${path}: numeric literal ${node} not allowed (whitelist: 0)`);
      } else {
        errors.push(`${path}: boolean literals are not allowed in components`);
      }
      return;
    }
    for (const [key, value] of Object.entries(node)) {
      walk(value, path === "" ? key : `${path}.${key}`);
    }
  };
  walk(comp, "components");
}

// --- specimen checks ---
function splitSpecimen(html) {
  const m = html.match(/<style id="mood-tokens">([\s\S]*?)<\/style>/);
  if (!m) return { tokenBlock: "", body: html };
  return {
    tokenBlock: m[1],
    body: html.slice(0, m.index) + html.slice(m.index + m[0].length),
  };
}

function checkSpecimen(tokens, html, errors) {
  if (/<script/i.test(html)) {
    errors.push("specimen contains <script>, which is forbidden");
  }
  const { tokenBlock, body } = splitSpecimen(html);
  if (!tokenBlock) {
    errors.push('specimen is missing <style id="mood-tokens"> block (run build-specimen)');
    return;
  }

  // token block must mirror tokens exactly
  const expected = expectedVars(tokens);
  const actual = new Set();
  for (const m of tokenBlock.matchAll(/--mood-[a-z0-9-]+/g)) actual.add(m[0]);
  for (const v of expected) {
    if (!actual.has(v)) errors.push(`specimen token block is missing ${v}`);
  }
  for (const v of actual) {
    if (!expected.has(v)) errors.push(`specimen token block declares ${v}, not present in tokens`);
  }

  // var(--mood-*) usage rules:
  // - allowlisted optional vars may carry a fallback and skip declaration;
  // - any other fallback usage is an error (it could mask a missing token);
  // - non-fallback usages must be declared in the token block.
  for (const m of body.matchAll(/var\((--mood-[a-z0-9-]+)(?:,|\s*\))/g)) {
    const hasFallback = m[0].includes(",");
    if (hasFallback && !FALLBACK_ALLOWED.has(m[1])) {
      errors.push(`specimen uses fallback on ${m[1]}, which is not in the fallback allowlist`);
    } else if (!hasFallback && !actual.has(m[1])) {
      errors.push(`specimen uses undefined ${m[1]} (declare the token or add a fallback)`);
    }
  }

  // color literals outside the token block
  const colorRe = /#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)/g;
  for (const m of body.matchAll(colorRe)) {
    errors.push(`color literal "${m[0]}" outside token block; use var(--mood-colors-*) or keyword`);
  }
  if (/(?:hsl|hsla|oklch|lab|lch|color)\(/i.test(body)) {
    errors.push("unsupported color function in specimen body (only hex/rgb(a) and var() references are allowed in v1)");
  }

  // magic numbers
  for (const m of body.matchAll(/font-size:\s*([\d.]+)px/g)) {
    const v = parseFloat(m[1]);
    if (!ALLOWED_FONT_SIZES.has(v)) errors.push(`font-size ${v}px not in allowlist (see css-var-mapping.md §5)`);
  }
  for (const m of body.matchAll(/letter-spacing:\s*([\d.]+)em/g)) {
    const v = parseFloat(m[1]);
    if (!ALLOWED_LETTER_SPACING.has(v)) errors.push(`letter-spacing ${v}em not in allowlist`);
  }
  for (const m of body.matchAll(/opacity:\s*([\d.]+)/g)) {
    const v = parseFloat(m[1]);
    if (!ALLOWED_OPACITY.has(v)) errors.push(`opacity ${v} not in allowlist`);
  }
  // generic pixel scan: font-size declarations are covered by their own
  // allowlist above, so exclude them here to avoid double-reporting.
  // Full numeric token (-?[\d.]+px) so 0.5px is caught as 0.5, not "5".
  const pxBody = body.replace(/font-size:\s*-?[\d.]+px/g, "");
  for (const m of pxBody.matchAll(/(-?[\d.]+)px/g)) {
    const v = parseFloat(m[1]);
    if (!ALLOWED_PX.has(v)) errors.push(`"${m[0]}" not in pixel allowlist`);
  }
}

// --- contrast (WCAG) ---
function parseColor(str) {
  str = String(str).trim();
  let m;
  if ((m = str.match(/^#([0-9a-fA-F]{3})$/))) {
    const [r, g, b] = [...m[1]].map((c) => parseInt(c + c, 16));
    return { r, g, b, a: 1 };
  }
  if ((m = str.match(/^#([0-9a-fA-F]{6})$/))) {
    return { r: parseInt(m[1].slice(0, 2), 16), g: parseInt(m[1].slice(2, 4), 16), b: parseInt(m[1].slice(4, 6), 16), a: 1 };
  }
  if ((m = str.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i))) {
    return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]), a: m[4] === undefined ? 1 : Number(m[4]) };
  }
  return null;
}

function composite(fg, bg) {
  const a = fg.a;
  return { r: fg.r * a + bg.r * (1 - a), g: fg.g * a + bg.g * (1 - a), b: fg.b * a + bg.b * (1 - a), a: 1 };
}

function luminance({ r, g, b }) {
  const linear = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

function checkContrast(tokens, item, errors) {
  const fgRaw = resolvePath(tokens, item.foreground);
  const bgRaw = resolvePath(tokens, item.background);
  if (fgRaw === undefined || bgRaw === undefined) {
    errors.push(`contrast: cannot resolve ${item.foreground} / ${item.background}`);
    return;
  }
  const fg = parseColor(fgRaw);
  const bg = parseColor(bgRaw);
  if (!fg || !bg) {
    errors.push(`contrast: cannot parse ${item.foreground}=${fgRaw} or ${item.background}=${bgRaw}`);
    return;
  }
  // composite semi-transparent backgrounds over colors.bg when available,
  // falling back to opaque white (docs/schema-checklist.md §3)
  let base = { r: 255, g: 255, b: 255, a: 1 };
  const bgTokenRaw = resolvePath(tokens, "colors.bg");
  if (bgTokenRaw !== undefined) {
    const parsedBase = parseColor(bgTokenRaw);
    if (parsedBase) base = parsedBase.a < 1 ? composite(parsedBase, base) : parsedBase;
  }
  const bgOpaque = bg.a < 1 ? composite(bg, base) : bg;
  const fgOpaque = fg.a < 1 ? composite(fg, bgOpaque) : fg;
  const l1 = luminance(fgOpaque);
  const l2 = luminance(bgOpaque);
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  if (ratio < item.minRatio) {
    errors.push(`contrast ${ratio.toFixed(2)} < ${item.minRatio} (${item.foreground} on ${item.background})`);
  }
}

// --- checklist execution ---
function runChecklist(tokens, checklist, errors, warnings) {
  for (const item of checklist) {
    if (item.type === "value") {
      const actual = resolvePath(tokens, item.assert.path);
      if (actual === undefined) {
        errors.push(`assert "${item.assert.path}" not found in tokens`);
      } else if (actual !== item.assert.eq) {
        errors.push(`assert ${item.assert.path}: expected ${JSON.stringify(item.assert.eq)}, got ${JSON.stringify(actual)}`);
      }
    } else if (item.type === "contrast") {
      checkContrast(tokens, item, errors);
    } else if (item.type === "token-only") {
      if (item.scope !== "colors" && item.scope !== "components") {
        warnings.push(`checklist item "${item.id}": token-only scope "${item.scope}" is not enforced in v1`);
      }
    }
    // token-only items are declarative: scope colors is enforced by the
    // unconditional specimen scan, scope components by the unconditional
    // components scan below. subjective items are for humans/agents.
  }
}

function validateMood(id) {
  const dir = join(root, "moods", id);
  const errors = [];
  const warnings = [];

  const tokensPath = join(dir, "tokens.json");
  if (!existsSync(tokensPath)) {
    return { id, errors: ["tokens.json missing"] };
  }
  const tokens = loadJson(tokensPath);
  if (!validateTokensSchema(tokens)) {
    errors.push(`tokens.json schema: ${formatSchemaErrors(validateTokensSchema.errors)}`);
  }
  if (tokens.components !== undefined) {
    checkComponents(tokens, errors);
  }

  const checklistPath = join(dir, "checklist.yaml");
  if (!existsSync(checklistPath)) {
    errors.push("checklist.yaml missing");
  } else {
    const checklist = loadYaml(checklistPath);
    if (!validateChecklistSchema(checklist)) {
      errors.push(`checklist schema: ${formatSchemaErrors(validateChecklistSchema.errors)}`);
    } else {
      runChecklist(tokens, checklist, errors, warnings);
    }
  }

  const specimenPath = join(dir, "specimen.html");
  if (!existsSync(specimenPath)) {
    errors.push("specimen.html missing (run ui-moods build-specimen <id>)");
  } else {
    checkSpecimen(tokens, readFileSync(specimenPath, "utf8"), errors);
  }

  return { id, errors, warnings };
}

// --- CLI ---
const args = process.argv.slice(2);
let moodFilter = null;
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--mood") moodFilter = args[i + 1];
}

let ids;
if (moodFilter) {
  ids = [moodFilter];
} else {
  const index = loadJson(join(root, "moods.json"));
  ids = (index.moods || []).map((m) => m.id);
}

let failed = 0;
for (const id of ids) {
  const result = validateMood(id);
  if (result.errors.length === 0) {
    console.log(`moods/${id}: PASS`);
  } else {
    failed++;
    console.log(`moods/${id}: FAIL (${result.errors.length} errors)`);
    for (const e of result.errors) console.log(`  - ${e}`);
  }
  for (const w of result.warnings) console.log(`  ! warn: ${w}`);
}
process.exit(failed ? 1 : 0);
