#!/usr/bin/env node
// ui-moods bundle — single-file prompt package (prompt + tokens + checklist +
// reference header). Never includes the full specimen by default.

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const args = process.argv.slice(2);
const id = args.find((a) => !a.startsWith("--"));
const withPreview = args.includes("--with-preview");

if (!id) {
  console.error("usage: ui-moods bundle <id> [--with-preview]");
  process.exit(1);
}

const dir = join(root, "moods", id);
const tokensPath = join(dir, "tokens.json");
if (!existsSync(tokensPath)) {
  console.error(`mood not found: ${tokensPath}`);
  process.exit(1);
}

const tokens = JSON.parse(readFileSync(tokensPath, "utf8").replace(/^\uFEFF/, ""));
const prompt = existsSync(join(dir, "prompt.md"))
  ? readFileSync(join(dir, "prompt.md"), "utf8").trim()
  : "(no prompt.md)";
const checklist = existsSync(join(dir, "checklist.yaml"))
  ? readFileSync(join(dir, "checklist.yaml"), "utf8").trim()
  : "(no checklist.yaml)";

let previewNote = "";
if (withPreview) {
  previewNote = existsSync(join(dir, "preview.png"))
    ? "\n- A preview image is available at `moods/<id>/preview.png` (visual channel, optional).\n"
    : "\n- Note: preview.png not found; visual channel skipped.\n";
}

const md = `# ui-moods bundle · mood/${tokens.id}@${tokens.version}

> Self-contained style reference package for AI agents. Pair it with your
> functional requirements. Colors/radii/spacing/effects/fonts may come only
> from the tokens below.

## 1. Style reference

\`\`\`
style: mood/${tokens.id}@${tokens.version}
\`\`\`

## 2. Description

${prompt}

## 3. Design tokens

\`\`\`json
${JSON.stringify(tokens, null, 2)}
\`\`\`

## 4. Acceptance checklist

\`\`\`yaml
${checklist}
\`\`\`

## 5. Rules

- Load the tokens and checklist above before writing any code.
- Use only token values for colors, radii, shadows, spacing, borders, effects and fonts.
- Do not read the full specimen.html by default; it is a human-facing artifact.
- Self-check against the checklist before delivery; cite the mood version in your summary.${previewNote}
`;

process.stdout.write(md);
