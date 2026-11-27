#!/usr/bin/env node
// build-themes — moods/<id>/tokens.json → themes/<id>.css
//
// One file per mood, each holding nothing but the component library's role
// variables. That is the whole point: the component CSS reads `--um-*`, and
// which values those hold is decided entirely by which theme file is linked.
//
//   <link rel="stylesheet" href="components/um-components.css">
//   <link rel="stylesheet" href="themes/neon.css">
//
// The contract is tokens/roles.json. A role that cannot be resolved is an
// error, not a warning: a component reading a variable nobody defines renders
// wrong on that theme and only that theme.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadContract, resolveTheme, themeCss } from "./lib/theme.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const contract = loadContract(join(root, "tokens", "roles.json"));
const index = JSON.parse(readFileSync(join(root, "moods.json"), "utf8"));

const outDir = join(root, "themes");
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

// `--mood <id>` and a bare id both select a subset; no argument means all.
const argv = process.argv.slice(2);
const only = [];
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === "--mood" && argv[i + 1]) only.push(argv[++i]);
  else if (!argv[i].startsWith("--")) only.push(argv[i]);
}
const allIds = index.moods.map((m) => m.id);
const ids = only.length ? only : allIds;
const selected = new Set(ids);

let failed = 0;
const catalogue = [];

// Every theme is resolved, so `themes/index.json` always describes the whole
// set; only the requested files are written. Building one theme used to
// rewrite the catalogue with that one entry and silently drop the other 31.
for (const id of allIds) {
  const tokensPath = join(root, "moods", id, "tokens.json");
  if (!existsSync(tokensPath)) {
    console.error(`moods/${id}/tokens.json not found`);
    failed++;
    continue;
  }
  const tokens = JSON.parse(readFileSync(tokensPath, "utf8").replace(/^\uFEFF/, ""));
  const { values, missing } = resolveTheme(tokens, contract);
  if (missing.length) {
    console.error(`themes/${id}.css: unresolved roles — ${missing.join(", ")}`);
    failed++;
    continue;
  }
  if (selected.has(id)) {
    writeFileSync(join(outDir, `${id}.css`), themeCss(id, values, contract, tokens.meta), "utf8");
  }
  catalogue.push({
    id,
    name: tokens.meta?.name ?? id,
    nameZh: tokens.meta?.nameZh ?? "",
    appearance: tokens.meta?.appearance ?? "light",
    file: `themes/${id}.css`,
    roles: values.size,
  });
}

writeFileSync(
  join(outDir, "index.json"),
  JSON.stringify({ version: contract.version, prefix: contract.prefix, themes: catalogue }, null, 2) + "\n",
  "utf8",
);

const written = catalogue.filter((t) => selected.has(t.id)).length;
console.log(
  `themes/: ${written} file(s) written, ${catalogue.length} in the catalogue, ${failed} failed`,
);
process.exit(failed ? 1 : 0);