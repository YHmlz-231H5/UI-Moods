#!/usr/bin/env node
// UI Moods CLI — entry point for `bin: ui-moods`.
// Implemented: build-specimen (R02/M1), bundle + validate (R03/M2), serve (R04/M2).

const commands = ["bundle", "validate", "serve", "build-specimen"];

function usage() {
  console.log(`ui-moods — Style Specimen Registry CLI

Usage:
  ui-moods bundle <id> [--with-preview]   Package a mood into a single prompt file (implemented R03/M2)
  ui-moods validate [--mood <id>]         Validate mood packages / the registry (implemented R03/M2)
  ui-moods serve [port]                   Start the local gallery (implemented R04/M2)
  ui-moods build-specimen <id>            Generate specimen.html from tokens.json (implemented R02/M1)
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

if (["build-specimen", "bundle", "validate"].includes(cmd)) {
  const { spawnSync } = await import("node:child_process");
  const { fileURLToPath } = await import("node:url");
  const scriptPath = fileURLToPath(new URL(`./${cmd}.mjs`, import.meta.url));
  const result = spawnSync(process.execPath, [scriptPath, ...process.argv.slice(3)], {
    stdio: "inherit",
  });
  process.exit(result.status ?? 1);
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

console.log(`ui-moods: "${cmd}" is recognized but not implemented yet.`);
