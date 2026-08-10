#!/usr/bin/env node
// build-specimen — tokens.json → specimen.html
// Single injection point: replaces the <style id="mood-tokens"> block and the
// {{id}} / {{name}} / {{keywords}} hero placeholders. See docs/css-var-mapping.md.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
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

function buildSpecimen(tokens, template) {
  const vars = buildVars(tokens);
  const rootBlock = `    :root {\n${vars}\n    }`;

  let html = template
    .replaceAll("{{id}}", tokens.id)
    .replaceAll("{{name}}", tokens.meta?.name ?? tokens.id)
    .replaceAll(
      "{{keywords}}",
      Array.isArray(tokens.meta?.keywords) ? tokens.meta.keywords.join(" · ") : ""
    );

  const styleRe = /(<style id="mood-tokens">)[\s\S]*?(<\/style>)/;
  if (!styleRe.test(html)) {
    throw new Error('template is missing <style id="mood-tokens"> block');
  }
  return html.replace(styleRe, `$1\n${rootBlock}\n    $2`);
}

const id = process.argv[2];
if (!id) {
  console.error("usage: ui-moods build-specimen <id>");
  process.exit(1);
}

const moodDir = join(root, "moods", id);
const tokensPath = join(moodDir, "tokens.json");
if (!existsSync(tokensPath)) {
  console.error(`tokens.json not found: ${tokensPath}`);
  process.exit(1);
}

const tokens = JSON.parse(readFileSync(tokensPath, "utf8").replace(/^\uFEFF/, ""));
const template = readFileSync(join(root, "templates", "mood", "specimen.html"), "utf8");
const html = buildSpecimen(tokens, template);

writeFileSync(join(moodDir, "specimen.html"), html);
console.log(`specimen.html generated for mood "${id}"`);
