#!/usr/bin/env node
// ui-moods scaffold — create a new mood package or app package.
//
// Usage:
//   ui-moods scaffold mood <id> [--name <Name>] [--name-zh <名称>]
//                          [--appearance light|dark] [--from <existing-id>]
//   ui-moods scaffold app <id> [--name <Name>] [--name-zh <名称>]
//                          [--mood <mood-id>]

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const args = process.argv.slice(2);
const kind = args[0];
const id = args[1];

function opt(name, fallback = null) {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
}

if (!kind || !id) {
  console.error(
    "usage:\n" +
      "  ui-moods scaffold mood <id> [--name <Name>] [--name-zh <名称>] [--appearance light|dark] [--from <existing-id>]\n" +
      "  ui-moods scaffold app <id> [--name <Name>] [--name-zh <名称>] [--mood <mood-id>]",
  );
  process.exit(1);
}

if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) {
  console.error(`invalid id "${id}" — expected lowercase kebab-case`);
  process.exit(1);
}

/* ------------------------------------------------------------- mood */

if (kind === "mood") {
  const dir = join(root, "moods", id);
  if (existsSync(dir)) {
    console.error(`moods/${id} already exists`);
    process.exit(1);
  }
  mkdirSync(dir, { recursive: true });

  const templateDir = join(root, "templates", "mood");
  let tokens = JSON.parse(readFileSync(join(templateDir, "tokens.json"), "utf8"));
  const from = opt("--from");
  if (from) {
    const src = join(root, "moods", from, "tokens.json");
    if (!existsSync(src)) {
      console.error(`source mood "${from}" not found`);
      process.exit(1);
    }
    tokens = JSON.parse(readFileSync(src, "utf8"));
  }

  tokens.id = id;
  tokens.version = "1.0.0";
  tokens.meta.name = opt("--name", id);
  tokens.meta.nameZh = opt("--name-zh", id);
  tokens.meta.appearance = opt("--appearance", "light");
  tokens.meta.keywords = ["replace-me"];

  writeFileSync(join(dir, "tokens.json"), JSON.stringify(tokens, null, 2) + "\n", "utf8");

  const checklist = readFileSync(join(templateDir, "checklist.yaml"), "utf8")
    .replaceAll("<mood-id>", id)
    .replace(
      'eq: "16px"',
      `eq: "${tokens.radii.card}"`,
    );
  writeFileSync(join(dir, "checklist.yaml"), checklist, "utf8");

  const prompt = `# Mood: ${id}

Describe the mood's visual character here — surfaces, light, typography, edges,
motion, and the overall feeling it produces. Keep it to one paragraph of at
most 200 words. Replace the keyword list with the four keywords declared in
meta.keywords.

## Keywords

\`one\`, \`two\`, \`three\`, \`four\`

## When to use

- A situation where this style fits
- Another situation where this style fits

## When to avoid

- A situation where this style clashes
- Another situation where this style clashes
`;
  writeFileSync(join(dir, "prompt.md"), prompt, "utf8");

  console.log(`moods/${id}: scaffolded`);
  console.log(`  next: fill tokens.json + prompt.md, then`);
  console.log(`        node tools/build-specimen.mjs ${id}`);
  console.log(`        node tools/validate.mjs --mood ${id}`);
  console.log(`        register "${id}" in moods.json`);
  process.exit(0);
}

/* -------------------------------------------------------------- app */

if (kind === "app") {
  const dir = join(root, "apps", id);
  if (existsSync(dir)) {
    console.error(`apps/${id} already exists`);
    process.exit(1);
  }
  mkdirSync(dir, { recursive: true });

  const mood = opt("--mood", "glass");
  if (!existsSync(join(root, "moods", mood, "tokens.json"))) {
    console.error(`mood "${mood}" not found`);
    process.exit(1);
  }

  const app = {
    id,
    name: opt("--name", id),
    nameZh: opt("--name-zh", id),
    mood,
    description: "Describe what this app pack covers.",
    chrome: {
      statusbar: { time: "9:41" },
      tabbar: {
        items: [
          { icon: "home", label: "首页", active: true },
          { icon: "search", label: "发现" },
          { icon: "bell", label: "消息" },
          { icon: "user", label: "我的" },
        ],
      },
    },
    screens: [
      {
        id: "home",
        title: "首页",
        titleZh: "首页",
        chrome: { navbar: { icon: "layers", title: "App", action: "操作" } },
        blocks: [
          { type: "header", title: "欢迎回来", subtitle: "今天也要元气满满" },
          { type: "search", placeholder: "搜索" },
          { type: "statGrid", items: [{ label: "指标一", value: "1,280" }, { label: "指标二", value: "94%" }] },
          { type: "list", items: [{ icon: "star", title: "条目一", sub: "说明", chev: true }] },
        ],
      },
    ],
  };
  writeFileSync(join(dir, "app.json"), JSON.stringify(app, null, 2) + "\n", "utf8");

  console.log(`apps/${id}: scaffolded`);
  console.log(`  next: edit app.json, then`);
  console.log(`        node tools/build-apps.mjs ${id}`);
  console.log(`        register "${id}" in apps.json`);
  process.exit(0);
}

console.error(`unknown scaffold kind "${kind}" — use "mood" or "app"`);
process.exit(1);
