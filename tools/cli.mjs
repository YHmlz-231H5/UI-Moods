#!/usr/bin/env node
// UI Moods CLI — entry point for `bin: ui-moods`.
//
// Commands:
//   bundle          package one mood into a single prompt file
//   validate        validate mood packages, app packages and the registry
//   serve           start the local library browser
//   build-specimen  generate specimen.html from tokens.json
//   build-apps      render industry app screens from app.json
//   scaffold        create a new mood package from the template

const commands = ["bundle", "validate", "serve", "build-specimen", "build-apps", "scaffold"];

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
const scriptPath = fileURLToPath(new URL(`./${cmd}.mjs`, import.meta.url));
const result = spawnSync(process.execPath, [scriptPath, ...process.argv.slice(3)], {
  stdio: "inherit",
});
process.exit(result.status ?? 1);
