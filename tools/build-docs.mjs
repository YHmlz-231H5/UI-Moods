#!/usr/bin/env node
// build-docs — the component documentation site.
//
// One page per component, plus an overview. Every page is generated from the
// component's manifest: the examples, the API tables, the class names, the
// accessibility notes. Nothing on a page is written by hand, which is the
// whole point — a documentation page that is hand-written is a second copy of
// the component, and the two copies drift.
//
// The site lives at `site/`. The pages are plain HTML: they load the
// component layer and one theme file, exactly the way a consumer would.
//
//   site/index.html               the overview
//   site/component/<id>.html      one page per component
//   site/assets/site.css          the site's own chrome
//   site/assets/site.js           the theme switcher

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadManifests, catalogue, CATEGORIES, modifierClass, partClass } from "./lib/manifest.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const siteDir = join(root, "site");

const { manifests, problems } = loadManifests(root);
if (problems.length) {
  for (const p of problems) console.error(`docs: ${p}`);
  console.log(`docs: FAIL (${problems.length} errors)`);
  process.exit(1);
}

const themesIndex = JSON.parse(readFileSync(join(root, "themes", "index.json"), "utf8").replace(/^\uFEFF/, ""));
const themes = {
  light: themesIndex.themes.filter((t) => t.appearance !== "dark").map((t) => t.id),
  dark: themesIndex.themes.filter((t) => t.appearance === "dark").map((t) => t.id),
};
const defaultTheme = themes.dark[0] ?? themes.light[0] ?? "neon";

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** The class column of the API table. */
function classCells(m) {
  const rows = [];
  rows.push([`<code>${esc(m.class.base)}</code>`, "The base class. Every instance carries it."]);
  for (const v of m.variants ?? []) {
    rows.push([`<code>${esc(modifierClass(m, v.id))}</code>`, v.name ?? v.id]);
  }
  for (const s of m.sizes ?? []) {
    rows.push([`<code>${esc(modifierClass(m, s.id))}</code>`, `Size: ${s.id}`]);
  }
  for (const p of m.parts ?? []) {
    rows.push([`<code>${esc(partClass(m, p.id))}</code>`, p.name ?? p.id]);
  }
  for (const s of m.states ?? []) {
    if (s.selector) {
      rows.push([`<code>${esc(s.selector)}</code>`, s.name ?? s.id]);
    }
  }
  return rows;
}

function table(headers, rows) {
  if (!rows.length) return "";
  const head = headers.map((h) => `<th>${esc(h)}</th>`).join("");
  const body = rows
    .map((cells) => `<tr>${cells.map((c) => `<td>${c}</td>`).join("")}</tr>`)
    .join("\n      ");
  return `<table class="api">
      <thead><tr>${head}</tr></thead>
      <tbody>
      ${body}
      </tbody>
    </table>`;
}

/**
 * A titled section — but only if it has something to say.
 *
 * A heading with an empty table under it is worse than no heading: the reader
 * scrolls to "Events", finds nothing, and concludes the component has no
 * events, which is a different claim from "this library does not use
 * events". So a section that has no rows is not written at all.
 */
function section(title, html) {
  if (!html) return "";
  return `      <h2>${esc(title)}</h2>\n${html}`;
}

function sidebar(activeId) {
  const groups = CATEGORIES.map((c) => {
    const items = manifests.filter((m) => m.category === c.id);
    if (!items.length) return "";
    const links = items
      .map(
        (m) =>
          `<li><a href="${m.id === activeId ? "" : `../component/${m.id}.html`}"${m.id === activeId ? ' aria-current="page"' : ""}>${esc(m.name)}${m.nameZh ? ` <span class="meta">${esc(m.nameZh)}</span>` : ""}</a></li>`,
      )
      .join("\n          ");
    return `<div class="site-sidebar__group">
        <h2 class="site-sidebar__title">${esc(c.name)} · ${esc(c.nameZh)}</h2>
        <ul class="site-sidebar__list">
          ${links}
        </ul>
      </div>`;
  }).join("\n      ");
  return groups;
}

function header(depthPrefix) {
  return `<header class="site-header">
      <a class="site-header__brand" href="${depthPrefix}index.html">UI Moods<span>Component Library</span></a>
      <div class="site-header__spacer"></div>
      <div class="switcher">
        <label class="switcher__label" for="um-theme-picker">Theme</label>
        <span class="switcher__field">
          <select class="switcher__select" id="um-theme-picker"></select>
        </span>
      </div>
    </header>`;
}

function page({ title, description, depthPrefix, body, activeId }) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(title)} · UI Moods</title>
  <meta name="description" content="${esc(description)}" />

  <!-- The two files that make the whole thing work.
       Swapping the second one re-skins every component on the page. -->
  <link rel="stylesheet" id="um-theme" href="${depthPrefix}themes/${defaultTheme}.css" />
  <link rel="stylesheet" href="${depthPrefix}components/um-components.css" />
  <link rel="stylesheet" href="${depthPrefix}site/assets/site.css" />
</head>
<body>
  ${header(depthPrefix)}
  <div class="site-body">
    <nav class="site-sidebar" aria-label="Components">
      ${sidebar(activeId)}
    </nav>
    <main class="site-main">
${body}
    </main>
  </div>

  <script>window.UM_THEMES = ${JSON.stringify(themes)};</script>
  <script src="${depthPrefix}site/assets/site.js"></script>
</body>
</html>
`;
}

// --- the overview -----------------------------------------------------------
const cards = CATEGORIES.map((c) => {
  const items = manifests.filter((m) => m.category === c.id);
  if (!items.length) return "";
  const cells = items
    .map(
      (m) => `<a class="card" href="component/${m.id}.html">
        <span class="card__name">${esc(m.name)} ${m.nameZh ? `<span class="card__zh">${esc(m.nameZh)}</span>` : ""}</span>
        <span class="card__summary">${esc(m.summary)}</span>
      </a>`,
    )
    .join("\n      ");
  return `<h2 id="${c.id}">${esc(c.name)} · ${esc(c.nameZh)} <span class="meta">${items.length}</span></h2>
    <div class="grid">
      ${cells}
    </div>`;
}).join("\n");

const overviewBody = `      <h1>Component Library</h1>
      <p class="lede">
        One component implementation, ${themesIndex.themes.length} skins. Every value on this
        page comes from <code>--um-*</code> variables; which values those hold is decided
        entirely by the theme file linked above.
      </p>
      <p class="meta">
        ${manifests.length} components documented. Every page is generated from the
        component's <code>manifest.json</code> — the examples, the API tables and the
        class names all come from one file.
      </p>
      <div class="note">
        <strong>Use it:</strong> link <code>components/um-components.css</code> and one
        <code>themes/&lt;id&gt;.css</code>, then write the classes.
        There is no build step and no JavaScript in the library.
      </div>
${cards}`;

writeFileSync(join(siteDir, "index.html"), page({
  title: "Component Library",
  description: "UI Moods component library — one implementation, 32 skins.",
  depthPrefix: "../",
  body: overviewBody,
  activeId: null,
}), "utf8");

// --- one page per component -------------------------------------------------
for (const m of manifests) {
  const examples = (m.examples ?? [])
    .map(
      (ex) => `<div class="example">
        <div class="example__title">${esc(ex.title)}${ex.titleZh ? ` · ${esc(ex.titleZh)}` : ""}</div>
        ${ex.description || ex.descriptionZh ? `<div class="example__desc">${esc(ex.description ?? ex.descriptionZh)}</div>` : ""}
        <div class="example__demo">
${ex.markup}
        </div>
        <pre class="example__code">${esc(ex.markup.trim())}</pre>
      </div>`,
    )
    .join("\n");

  const propRows = (m.props ?? []).map((p) => [
    `<span class="api__name"><code>${esc(p.name)}</code></span>`,
    `<code>${esc(p.type)}${p.values ? ` = ${esc(p.values.join(" | "))}` : ""}</code>`,
    p.default ? `<code>${esc(p.default)}</code>` : "—",
    esc(p.description ?? p.descriptionZh ?? ""),
  ]);

  const slotRows = (m.slots ?? []).map((s) => [
    `<span class="api__name"><code>${esc(s.name)}</code></span>`,
    esc(s.description ?? s.descriptionZh ?? ""),
  ]);

  const eventRows = (m.events ?? []).map((e) => [
    `<span class="api__name"><code>${esc(e.name)}</code></span>`,
    esc(e.description ?? e.descriptionZh ?? ""),
  ]);

  const a11y = m.a11y ?? {};
  const a11yBlock = [
    a11y.role ? `<p><strong>Role:</strong> <code>${esc(a11y.role)}</code></p>` : "",
    a11y.keyboard?.length
      ? `<p><strong>Keyboard:</strong> ${a11y.keyboard.map((k) => `<code>${esc(k)}</code>`).join(" ")}</p>`
      : "",
    a11y.notes ? `<p>${esc(a11y.notes)}</p>` : "",
  ]
    .filter(Boolean)
    .join("\n        ");

  const body = `      <h1>${esc(m.name)}${m.nameZh ? ` <span class="meta">${esc(m.nameZh)}</span>` : ""}</h1>
      <p class="lede">${esc(m.summary)}</p>
      <p class="meta">
        <span class="tag">${esc(m.element)}</span>
        <span class="tag">${esc(m.category)}</span>
        ${m.since ? `<span class="tag">since ${esc(m.since)}</span>` : ""}
      </p>
${m.notes ? `      <div class="note">${esc(m.notes)}</div>\n` : ""}
      <h2>Examples</h2>
${examples}
${section("Classes", table(["Class", "Meaning"], classCells(m)))}
${section("Props", table(["Name", "Type", "Default", "Description"], propRows))}
${section("Slots", table(["Name", "Description"], slotRows))}
${section("Events", table(["Name", "Description"], eventRows))}
      <h2>Accessibility</h2>
${a11yBlock ? `      ${a11yBlock}\n` : "      <p class=\"meta\">No specific requirements beyond the native element's.</p>\n"}`;

  const outDir = join(siteDir, "component");
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, `${m.id}.html`), page({
    title: m.name,
    description: m.summary,
    depthPrefix: "../../",
    body,
    activeId: m.id,
  }), "utf8");
}

// --- the old single-page browser becomes a pointer ---------------------------
const pointer = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="refresh" content="0; url=../site/index.html" />
  <title>UI Moods · Component Library</title>
</head>
<body>
  <p>The component browser moved to <a href="../site/index.html">site/index.html</a> — it is now one page per component, generated from each component's manifest.</p>
</body>
</html>
`;
writeFileSync(join(root, "components", "index.html"), pointer, "utf8");

console.log(`site: ${manifests.length} component pages + overview`);
