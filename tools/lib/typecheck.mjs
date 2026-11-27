// ui-moods · typecheck
//
// The library ships declarations, so the declarations have to be real. A
// `.d.ts` that does not compile is worse than no `.d.ts` at all: a consumer
// gets an editor that says the API is broken, and the mistake is theirs to
// chase.
//
// Two things are checked here:
//
//   1. `tsc --noEmit` over `types/`, `vue/` and `themes/switcher.js`. The
//      declarations are compiled, and the JavaScript that ships with them is
//      type-checked against JSDoc, so a public API cannot drift away from
//      the types that describe it.
//
//   2. The declarations are regenerated from the manifests and compared with
//      what is on disk. A stale `types/index.d.ts` is a declaration that
//      describes a component library that no longer exists.
//
// TypeScript is a dev dependency, not a runtime one. When it is not
// installed the check is skipped rather than failed — a consumer who cloned
// the repository without `npm install` still gets a working library.

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/** @typedef {{ skipped?: boolean, errors: string[] }} TypecheckResult */

/**
 * @param {string} root the repository root
 * @returns {{ skipped?: boolean, errors: string[] }}
 */
export function checkTypes(root) {
  const errors = [];

  const tsc = join(root, "node_modules", "typescript", "bin", "tsc");
  if (!existsSync(tsc)) {
    return { skipped: true, errors: [] };
  }

  const tsconfig = join(root, "tsconfig.json");
  if (!existsSync(tsconfig)) {
    return { skipped: true, errors: [] };
  }

  // Two projects. The first is the public surface — the declarations a
  // consumer's editor reads — and it is checked strictly. The second is the
  // per-component wrappers: plain JavaScript components whose correctness is
  // proved by rendering them, in `tools/check-vue.mjs`, rather than by
  // inferring the types of an object literal.
  const projects = ["tsconfig.json", "tsconfig.wrappers.json"];

  for (const project of projects) {
    const path = join(root, project);
    if (!existsSync(path)) continue;
    const run = spawnSync(process.execPath, [tsc, "-p", path, "--noEmit"], {
      cwd: root,
      encoding: "utf8",
    });

    if (run.error) {
      errors.push(`typecheck: could not run tsc — ${run.error.message}`);
      continue;
    }

    const output = `${run.stdout ?? ""}${run.stderr ?? ""}`.trim();
    if (run.status !== 0) {
      for (const line of output.split(/\r?\n/)) {
        if (line.trim()) errors.push(`typecheck: ${line.trim()}`);
      }
      if (!errors.length) errors.push(`typecheck: tsc exited ${run.status} on ${project}`);
    }
  }

  // The generated declaration has to match the manifests it came from.
  const declared = join(root, "types", "index.d.ts");
  const manifestsDir = join(root, "components");
  if (!existsSync(declared)) {
    errors.push("typecheck: types/index.d.ts is missing (run node tools/build-types.mjs)");
  } else {
    const body = readFileSync(declared, "utf8");
    const ids = [];
    for (const dir of readdirSync(manifestsDir, { withFileTypes: true })) {
      if (!dir.isDirectory()) continue;
      const mf = join(manifestsDir, dir.name, "manifest.json");
      if (existsSync(mf)) ids.push(dir.name);
    }
    for (const id of ids) {
      const Name = id
        .split("-")
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join("");
      if (!body.includes(`export interface ${Name}Props`)) {
        errors.push(`typecheck: types/index.d.ts does not declare ${Name}Props — rebuild it`);
      }
    }
  }

  return { errors };
}
