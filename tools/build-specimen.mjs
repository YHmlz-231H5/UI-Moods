#!/usr/bin/env node
// build-specimen — tokens.json → specimen.html
//
// A specimen is assembled from three parts:
//   1. templates/mood/specimen.html   — the shell (head, chrome, layout)
//   2. templates/mood/sections/*.html — section partials, injected in order
//   3. tokens.json                     — the injected CSS custom properties
//
// The style block with id "mood-tokens" is the single injection point.
// Section partials are pure markup + a <style> block; they may only use
// var(--mood-*) for theme parameters.

import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { MAPPED_GROUPS, SKIP_FIELDS, kebabCase } from "./lib/mapping.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function buildVars(tokens) {
  const lines = [];
  for (const group of MAPPED_GROUPS) {
    const obj = tokens[group];
    if (!obj || typeof obj !== "object") continue;
    for (const [key, value] of Object.entries(obj)) {
      if (SKIP_FIELDS.has(key)) continue;
      if (typeof value !== "string" && typeof value !== "number") continue;
      lines.push(`      --mood-${group}-${kebabCase(key)}: ${value};`);
    }
  }
  return lines.join("\n");
}

/** Read every section partial, ordered by filename. */
function readSections(sectionsDir) {
  if (!existsSync(sectionsDir)) return "";
  return readdirSync(sectionsDir)
    .filter((f) => f.endsWith(".html"))
    .sort()
    .map((f) => {
      const html = readFileSync(join(sectionsDir, f), "utf8").trim();
      return `<!-- ${f} -->\n${html}`;
    })
    .join("\n\n");
}

function buildSpecimen(tokens, shell) {
  const vars = buildVars(tokens);
  const rootBlock = `    :root {\n${vars}\n    }`;

  let html = shell
    .replaceAll("{{id}}", () => tokens.id)
    .replaceAll("{{name}}", () => tokens.meta?.name ?? tokens.id)
    .replaceAll(
      "{{keywords}}",
      () => (Array.isArray(tokens.meta?.keywords) ? tokens.meta.keywords.join(" · ") : ""),
    );

  const styleRe = /(<style id="mood-tokens">)[\s\S]*?(<\/style>)/;
  if (!styleRe.test(html)) {
    throw new Error('template is missing <style id="mood-tokens"> block');
  }
  // Function form: capture groups are not expanded automatically, so take the
  // matched tags as arguments instead of relying on $1 / $2.
  return html.replace(styleRe, (_match, open, close) => `${open}\n${rootBlock}\n    ${close}`);
}

/** The marker that separates the shell's leading comment from the real body
 *  injection point. Kept out of the comment so a naive replace cannot put the
 *  sections inside <head>. */
const SECTION_MARKER = "{{sections}}";

/**
 * Inject the section partials at the body's marker.
 *
 * The shell mentions the marker inside its own HTML comment, so a first-match
 * replacement lands the sections inside <head> — the parser then relocates
 * them and leaves the raw template visible at the end of the page. Always
 * target the LAST occurrence, which is the one inside <body>.
 */
function injectSections(shell, sections) {
  const idx = shell.lastIndexOf(SECTION_MARKER);
  if (idx < 0) throw new Error(`template is missing the ${SECTION_MARKER} marker`);
  return shell.slice(0, idx) + sections + shell.slice(idx + SECTION_MARKER.length);
}

const args = process.argv.slice(2);
const ids = args.filter((a) => !a.startsWith("--"));

if (ids.length === 0) {
  console.error("usage: ui-moods build-specimen <id> [<id> ...]");
  process.exit(1);
}

const shell = readFileSync(join(root, "templates", "mood", "specimen.html"), "utf8");
const sectionsDir = join(root, "templates", "mood", "sections");
const sections = readSections(sectionsDir);

let failed = 0;
for (const id of ids) {
  const moodDir = join(root, "moods", id);
  const tokensPath = join(moodDir, "tokens.json");
  if (!existsSync(tokensPath)) {
    console.error(`tokens.json not found: ${tokensPath}`);
    failed++;
    continue;
  }
  const tokens = JSON.parse(readFileSync(tokensPath, "utf8").replace(/^\uFEFF/, ""));
  const html = buildSpecimen(tokens, injectSections(shell, sections));
  writeFileSync(join(moodDir, "specimen.html"), html, "utf8");
  console.log(`moods/${id}/specimen.html: written`);
}
process.exit(failed ? 1 : 0);
