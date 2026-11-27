#!/usr/bin/env node
// check-vue — the Vue component checks on their own.
//
//   node tools/validate.mjs runs everything, which is the right thing before
//   a release and the wrong thing while a wrapper is being written. This runs
//   just the Vue layer, so a wrapper can be checked on its own.
//
//   node tools/check-vue.mjs --only button tag   # only these components

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { checkVueComponents } from "./lib/vue-check.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const args = process.argv.slice(2);
const only = [];
const onlyAt = args.indexOf("--only");
if (onlyAt >= 0) {
  for (const a of args.slice(onlyAt + 1)) {
    if (a.startsWith("--")) break;
    only.push(a);
  }
}

const result = await checkVueComponents(root, { only });
if (result.skipped) {
  console.log("vue: SKIP (vue is not installed — run npm install)");
  process.exit(0);
}
for (const w of result.warnings) console.log(`  ! warn: ${w}`);
if (result.errors.length) {
  console.log(`vue: FAIL (${result.errors.length} errors)`);
  for (const e of result.errors) console.log(`  - ${e}`);
  process.exit(1);
}
console.log("vue: PASS");
