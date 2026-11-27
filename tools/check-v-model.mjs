#!/usr/bin/env node
// check-v-model — does the binding actually bind?
//
// The check itself lives in `tools/lib/v-model-check.mjs`, because the
// validator runs it too: a binding that is declared but does not bind is
// worth knowing about before anybody writes `v-model` in a template.

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { checkVModel } from "./lib/v-model-check.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const result = await checkVModel(root);

if (result.skipped) {
  console.log("v-model: SKIP (vue is not installed — run npm install)");
  process.exit(0);
}
if (result.errors.length) {
  for (const e of result.errors) console.error(`v-model: ${e}`);
  console.log(`v-model: FAIL (${result.errors.length} errors)`);
  process.exit(1);
}
console.log("v-model: PASS");
