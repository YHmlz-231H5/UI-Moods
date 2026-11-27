#!/usr/bin/env node
// verify-themes — the combined sheet has to equal the single-file themes.
//
// `themes/all.css` carries all 32 moods at once, and `themes/<id>.css` carries
// one. They are two renderings of the same contract, and a consumer may load
// either. So every value in every mood has to be identical in both — a role
// that differs is a component that looks right in the documentation and wrong
// in the product.
//
// The check is a value-by-value comparison, not a file comparison: the two
// sheets are written differently on purpose (the combined one uses a scope
// selector per mood and a single `:root` fallback at the end), and what has
// to match is what the browser resolves, not how the file is spelled.
//
//   node tools/verify-themes.mjs

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/** `--um-name: value;` pairs in a block of CSS. */
function declarations(css) {
  const out = new Map();
  for (const m of css.matchAll(/(--um-[a-z0-9-]+)\s*:\s*([^;]+);/g)) {
    out.set(m[1], m[2].trim().toLowerCase());
  }
  return out;
}

/**
 * The values a stylesheet declares for one selector.
 *
 * A block is everything between `{` and the matching `}`. The combined sheet
 * declares one block per mood, each under its own scope selector, and one
 * `:root` block at the end for the default mood.
 */
function blocks(css) {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const out = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(clean))) {
    out.push({ selector: m[1].trim(), values: declarations(m[2]) });
  }
  return out;
}

const index = JSON.parse(readFileSync(join(root, "themes", "index.json"), "utf8").replace(/^\uFEFF/, ""));
const combinedPath = join(root, "themes", "all.css");
if (!existsSync(combinedPath)) {
  console.log("verify-themes: themes/all.css is missing — run `ui-moods build-themes`");
  process.exit(1);
}

const combined = blocks(readFileSync(combinedPath, "utf8"));
const combinedById = new Map();
for (const block of combined) {
  for (const m of block.selector.matchAll(/data-um-theme="([a-z0-9-]+)"/g)) {
    combinedById.set(m[1], block.values);
  }
}
const combinedDefault = combined.find((b) => b.selector === ":root");

let checked = 0;
let mismatches = 0;

// Every mood has to have a scope of its own — not only the thirty-one that
// are not the default. A scope is what lets a subtree wear a mood, and a
// default mood that had only a `:root` block could be worn by the document
// and by nothing else.
for (const theme of index.themes ?? []) {
  if (!combinedById.has(theme.id)) {
    console.log(`verify-themes: themes/all.css has no scope for "${theme.id}"`);
    mismatches++;
  }
}

for (const theme of index.themes ?? []) {
  const single = declarations(readFileSync(join(root, theme.file), "utf8").replace(/\/\*[\s\S]*?\*\//g, ""));

  // The single-file sheet declares every role of the mood under `:root` as
  // well as under its own scope, so the values are read from the scope block.
  const singleBlocks = blocks(readFileSync(join(root, theme.file), "utf8"));
  const scope = singleBlocks.find((b) => b.selector.includes(`data-um-theme="${theme.id}"`));
  const expected = scope ? scope.values : single;

  const actual = combinedById.get(theme.id);
  if (!actual) {
    console.log(`verify-themes: themes/all.css has no scope for "${theme.id}"`);
    mismatches++;
    continue;
  }

  for (const [name, value] of expected) {
    checked++;
    const got = actual.get(name);
    if (got === undefined) {
      console.log(`verify-themes: ${theme.id} — all.css does not declare ${name}`);
      mismatches++;
    } else if (got !== value) {
      console.log(`verify-themes: ${theme.id} — ${name} is "${got}" in all.css and "${value}" in ${theme.file}`);
      mismatches++;
    }
  }

  for (const name of actual.keys()) {
    if (!expected.has(name)) {
      console.log(`verify-themes: ${theme.id} — all.css declares ${name}, which the single file does not`);
      mismatches++;
    }
  }
}

// The default mood is also the sheet's `:root` fallback, so it has to be there
// and it has to be the same values.
const fallback = index.default;
if (fallback && combinedDefault) {
  const singleBlocks = blocks(readFileSync(join(root, "themes", `${fallback}.css`), "utf8"));
  const scope = singleBlocks.find((b) => b.selector.includes(`data-um-theme="${fallback}"`));
  const expected = scope ? scope.values : new Map();
  for (const [name, value] of expected) {
    checked++;
    const got = combinedDefault.values.get(name);
    if (got !== value) {
      console.log(`verify-themes: the :root fallback — ${name} is "${got}" and should be "${value}"`);
      mismatches++;
    }
  }
} else if (fallback) {
  console.log("verify-themes: themes/all.css has no :root fallback");
  mismatches++;
}

console.log(
  `verify-themes: ${checked} values compared across ${index.themes?.length ?? 0} moods, ` +
    `${mismatches} mismatches`,
);
process.exit(mismatches ? 1 : 0);
