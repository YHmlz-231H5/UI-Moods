#!/usr/bin/env node
// check-package — is the package actually usable by a host?
//
// The check itself lives in `tools/lib/package-check.mjs`, because the
// validator runs it too: a package that resolves its own names is worth
// knowing about before anybody installs it.

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { checkPackage } from "./lib/package-check.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const { problems, stats } = await checkPackage(root);

if (problems.length) {
  for (const p of problems) console.error(`package: ${p}`);
  console.log(`package: FAIL (${problems.length} errors)`);
  process.exit(1);
}

console.log(
  `package: PASS — ${stats.resolved} public names resolved, ` +
    `${stats.components} components and ${stats.themes} moods published, Vue renders`,
);
