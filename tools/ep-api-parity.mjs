#!/usr/bin/env node
// Compare this library's declared API against Element Plus's, and write the
// report to `docs/ep-api-parity.md`.
//
//   node tools/ep-api-parity.mjs                        write the report
//   node tools/ep-api-parity.mjs --check                fail if the report is out of date
//   node tools/ep-api-parity.mjs --dump                 print the gaps, nothing else
//   node tools/ep-api-parity.mjs --element-plus <dir>   compare against another copy
//
// The comparison itself lives in `tools/lib/ep-api-check.mjs`, because the
// build has to be able to run it too.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { compareEpApi, renderReport } from "./lib/ep-api-check.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const reportPath = join(root, "docs", "ep-api-parity.md");

const argv = process.argv.slice(2);
const flag = (name) => argv.includes(name);
const value = (name) => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
};

const epRoot = value("--element-plus");
const comparison = compareEpApi(root, epRoot ? { epRoot } : {});

if (flag("--dump")) {
  for (const r of comparison.results) {
    const missing = [
      ...r.props.filter((x) => x.status === "gap").map((x) => ({ ...x, kind: "prop" })),
      ...r.slots.filter((x) => x.status === "gap").map((x) => ({ ...x, kind: "slot" })),
      ...r.events.filter((x) => x.status === "gap").map((x) => ({ ...x, kind: "event" })),
    ];
    if (!missing.length) continue;
    console.log(`\n${r.id}  (${r.ep})`);
    for (const m of missing) console.log(`  ${m.kind.padEnd(6)} ${m.name}`);
  }
  console.log(`\n${comparison.gaps.length} gaps`);
  process.exit(comparison.gaps.length ? 1 : 0);
}

const report = renderReport(comparison);

if (flag("--check")) {
  const current = existsSync(reportPath) ? readFileSync(reportPath, "utf8") : "";
  if (current !== report) {
    console.error("docs/ep-api-parity.md is out of date — run `node tools/ep-api-parity.mjs`");
    process.exit(1);
  }
  // The gaps are the work list, not a broken build: the report records them
  // and the check only insists that the report still matches the sources.
  console.log(
    `  gaps left: ${comparison.gaps.length} ` +
      `(props ${comparison.totals.props.gap}, slots ${comparison.totals.slots.gap}, events ${comparison.totals.events.gap})`,
  );
} else {
  writeFileSync(reportPath, report, "utf8");
}

for (const e of comparison.errors) console.error(e);

console.log(`ep-api-parity · element-plus ${comparison.version}`);
console.log(
  `  props  ${comparison.totals.props.covered} covered, ${comparison.totals.props.renamed} renamed, ` +
    `${comparison.totals.props.equivalent} equivalent, ${comparison.totals.props.skipped} skipped, ${comparison.totals.props.gap} gaps`,
);
console.log(
  `  slots  ${comparison.totals.slots.covered} covered, ${comparison.totals.slots.skipped} skipped, ` +
    `${comparison.totals.slots.gap} gaps`,
);
console.log(`  events ${comparison.totals.events.covered} covered, ${comparison.totals.events.gap} gaps`);
if (!flag("--check")) console.log(`  report ${reportPath}`);
process.exit(comparison.errors.length || (!flag("--check") && comparison.gaps.length) ? 1 : 0);
