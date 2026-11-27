#!/usr/bin/env node
// UI Moods CLI — entry point for `bin: ui-moods`.
//
// Commands:
//   bundle          package one mood into a single prompt file
//   validate        validate mood packages, app packages and the registry
//   serve           start the local library browser
//   build-specimen  generate specimen.html from tokens.json
//   build-apps      render industry app screens from app.json
//   build-themes    generate themes/<id>.css from the mood tokens
//   build-components  assemble the component stylesheet from the manifests
//   build-dist       cut the stylesheet into one file per component
//   build-docs      generate the component documentation site
//   build-types     generate types/index.d.ts from the manifests
//   build-vue       generate the Vue 3 package from the manifests
//   check-vue       check every Vue wrapper against the manifest it was written from
//   check-component check one component's manifest and stylesheet
//   check-package   check that the package's public names resolve and render
//   check-v-model   check that the bindings actually bind
//   audit-contrast  print the measured contrast of the contract across every mood
//   audit-render    measure the rendered result in a headless browser
//   verify-themes   check themes/all.css against the single-file themes
//   scaffold        create a new mood package from the template

const commands = [
  "bundle",
  "validate",
  "serve",
  "build-specimen",
  "build-apps",
  "build-themes",
  "build-components",
  "build-dist",
  "build-docs",
  "build-types",
  "build-vue",
  "check-vue",
  "check-component",
  "check-package",
  "check-v-model",
  "audit-contrast",
  "audit-render",
  "verify-themes",
  "scaffold",
];

/**
 * The commands that read the registry — the mood packages, the app packages,
 * the generated specimen pages.
 *
 * The npm tarball is the component library: the stylesheets, the 32 moods as
 * CSS, the Vue package and the types. The registry payloads are large and
 * generated, so they are not in it — they are in the repository. A command
 * that needs them says so rather than failing on a missing file.
 */
const registryCommands = new Set([
  "bundle",
  "build-specimen",
  "build-apps",
  "scaffold",
]);

function usage() {
  console.log(`ui-moods — Style Specimen Registry & App Reference Library

Usage:
  ui-moods bundle <id> [--with-preview]   Package a mood into a single prompt file
  ui-moods validate [--mood <id>]         Validate moods, apps and the registry
  ui-moods validate --app <id>            Validate one app package
  ui-moods serve [port]                   Start the local library browser
  ui-moods build-specimen <id> [...]      Generate specimen.html from tokens.json
  ui-moods build-apps <id> [--mood <id>]  Render industry app screens
  ui-moods build-apps --all               Render every registered app
  ui-moods build-themes [--mood <id>]     Generate themes/<id>.css from the mood tokens
  ui-moods build-components               Assemble components/um-components.css
  ui-moods build-dist                     Cut the stylesheet into one file per component
  ui-moods build-docs                     Generate the component documentation site
  ui-moods build-types                    Generate types/index.d.ts
  ui-moods build-vue                       Generate the Vue 3 package
  ui-moods check-vue                       Check the Vue wrappers against the manifests
  ui-moods check-component [id ...]         Check one component's manifest and stylesheet
  ui-moods check-package                   Check that the package's public names resolve and render
  ui-moods check-v-model                   Check that the bindings actually bind
  ui-moods audit-contrast                  Print the measured contrast of every mood
  ui-moods audit-render [contrast|geometry|motion|package|apps]
                                           Measure the rendered result in a headless browser
  ui-moods verify-themes                   Check themes/all.css against the single-file themes
  ui-moods scaffold <id> [--mood <id>]    Create a new mood package from the template
  ui-moods --help                         Show this help
`);
}

const [cmd] = process.argv.slice(2);

if (!cmd || cmd === "--help" || cmd === "-h") {
  usage();
  process.exit(cmd ? 0 : 1);
}

if (!commands.includes(cmd)) {
  console.error(`ui-moods: unknown command "${cmd}"`);
  usage();
  process.exit(1);
}

if (cmd === "serve") {
  const { spawn } = await import("node:child_process");
  const { fileURLToPath } = await import("node:url");
  const scriptPath = fileURLToPath(new URL("./serve.mjs", import.meta.url));
  const child = spawn(process.execPath, [scriptPath, ...process.argv.slice(3)], {
    stdio: "inherit",
  });
  child.on("exit", (code) => process.exit(code ?? 0));
  await new Promise(() => {});
}

const { spawnSync } = await import("node:child_process");
const { fileURLToPath } = await import("node:url");

// The registry payloads are not in the npm tarball — the tarball is the
// component library. A command that needs them says so, rather than dying on
// a missing file with a stack trace.
if (registryCommands.has(cmd)) {
  const { existsSync } = await import("node:fs");
  const { dirname, join } = await import("node:path");
  const root = dirname(dirname(fileURLToPath(import.meta.url)));
  if (!existsSync(join(root, "moods.json"))) {
    console.error(
      `ui-moods: "${cmd}" reads the registry — the mood packages and the app\n` +
        `         packages — and those live in the repository, not in the npm\n` +
        `         tarball. Clone the repository to run this command.`,
    );
    process.exit(2);
  }
}

const scriptPath = fileURLToPath(new URL(`./${cmd}.mjs`, import.meta.url));
const result = spawnSync(process.execPath, [scriptPath, ...process.argv.slice(3)], {
  stdio: "inherit",
});
process.exit(result.status ?? 1);
