// UI Moods · component library checks.
//
// The mood checks prove a specimen or screen respects its tokens. These checks
// prove something different and easy to get wrong: that the component library
// and the theme files actually meet each other.
//
//   - every theme defines every role the contract requires;
//   - the component CSS reads no variable that no theme provides;
//   - the component CSS contains no colour, radius or font-size literal;
//   - the component browser lists exactly the themes that exist.
//
// A missing role is invisible in a screenshot of one theme and breaks every
// component that reads it in every other theme, so it is an error.

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { contrastRatio, parseColor } from "./state-colors.mjs";
import { loadManifests } from "./manifest.mjs";
import { boxModelCss } from "./box-model.mjs";

const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, "");

/** The custom properties a stylesheet declares. */
function declaredVars(css) {
  const out = new Set();
  for (const m of css.matchAll(/(--[a-z0-9-]+)\s*:/gi)) out.add(m[1]);
  return out;
}

/** The custom properties a stylesheet reads. */
function usedVars(css) {
  const out = new Set();
  for (const m of css.matchAll(/var\(\s*(--[a-z0-9-]+)/gi)) out.add(m[1]);
  return out;
}

function propertyValues(css, property) {
  const out = [];
  const re = new RegExp(`(?:^|[;{])\\s*${property}\\s*:\\s*([^;{}]+)`, "gi");
  for (const m of css.matchAll(re)) out.push(m[1].trim());
  return out;
}

export function checkComponentLibrary(root) {
  const problems = [];
  const note = (message) => problems.push(message);

  const contractPath = join(root, "tokens", "roles.json");
  const allowlistPath = join(root, "schemas", "component-allowlist.json");
  const cssPath = join(root, "components", "um-components.css");
  const indexPath = join(root, "themes", "index.json");

  if (!existsSync(contractPath)) return ["tokens/roles.json missing"];
  if (!existsSync(cssPath)) return ["components/um-components.css missing"];
  if (!existsSync(indexPath)) return ["themes/index.json missing — run tools/build-themes.mjs"];

  const contract = JSON.parse(readFileSync(contractPath, "utf8").replace(/^\uFEFF/, ""));
  const allowlist = JSON.parse(readFileSync(allowlistPath, "utf8").replace(/^\uFEFF/, ""));
  const index = JSON.parse(readFileSync(indexPath, "utf8").replace(/^\uFEFF/, ""));
  const css = stripComments(readFileSync(cssPath, "utf8"));

  const prefix = contract.prefix ?? "--um";
  const roles = contract.roles ?? {};
  const optional = new Set(contract.optional ?? []);
  const roleVars = new Set(Object.keys(roles).map((r) => `${prefix}-${r}`));
  const constants = new Set(
    Object.keys(contract.componentConstants ?? {}).filter((k) => k.startsWith("--")),
  );
  const known = new Set([...roleVars, ...constants]);

  // A component may own a variable of its own — `--um-button-label` holds the
  // button's label colour, derived from a theme role. Two rules keep that
  // honest: the variable has to be declared in the component layer (so a typo
  // is still a typo), and it has to be namespaced under a real component id
  // (so it can never shadow a theme role such as `--um-color-primary`).
  const { manifests } = loadManifests(root);
  const componentIds = manifests.map((m) => m.id);
  const cssVars = declaredVars(css);
  const isComponentScoped = (v) =>
    componentIds.some((id) => v.startsWith(`${prefix}-${id}-`)) && cssVars.has(v);

  // --- 1. the component layer reads only known variables -------------------
  for (const v of usedVars(css)) {
    if (!known.has(v) && !isComponentScoped(v)) {
      note(`components/um-components.css reads ${v}, which no theme defines`);
    }
  }

  // --- 2. the component layer declares every constant ----------------------
  for (const c of constants) {
    if (!cssVars.has(c)) note(`components/um-components.css does not declare ${c}`);
  }

  // --- 3. no colour literal in the component layer -------------------------
  for (const m of css.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) {
    note(`components/um-components.css has colour literal ${m[0]}; use var(--um-*)`);
  }
  for (const m of css.matchAll(/\brgba?\([^)]*\)/gi)) {
    note(`components/um-components.css has colour literal ${m[0]}; use var(--um-*)`);
  }

  // --- 4. no raw radius or font size --------------------------------------
  for (const value of propertyValues(css, "border-radius")) {
    const bare = value.replace(/var\(--um-[a-z0-9-]+\)/g, "").trim();
    if (bare && bare !== "0" && bare !== "50%") {
      note(`components/um-components.css has border-radius: ${value}; use var(--um-radius-*)`);
    }
  }
  for (const value of propertyValues(css, "font-size")) {
    if (!/^var\(--um-font-size-[a-z0-9-]+\)$/.test(value)) {
      note(`components/um-components.css has font-size: ${value}; use var(--um-font-size-*)`);
    }
  }

  // --- 5. px literals are allowlisted --------------------------------------
  const allowedPx = new Set(allowlist.px ?? []);
  for (const m of css.matchAll(/(-?\d+(?:\.\d+)?)px/g)) {
    if (!allowedPx.has(m[1])) {
      note(`components/um-components.css has ${m[0]} literal; add it to schemas/component-allowlist.json with a reason`);
    }
  }

  // --- 6. every theme defines every required role ---------------------------
  for (const theme of index.themes ?? []) {
    const path = join(root, theme.file);
    if (!existsSync(path)) {
      note(`themes/${theme.id}.css missing — run tools/build-themes.mjs`);
      continue;
    }
    const themeCss = stripComments(readFileSync(path, "utf8"));
    const declared = declaredVars(themeCss);
    for (const role of Object.keys(roles)) {
      const v = `${prefix}-${role}`;
      if (declared.has(v)) continue;
      if (optional.has(role)) {
        // An optional role is optional in the *mood*, not in the theme file.
        // A theme that leaves it out inherits it from whichever theme file
        // was linked after it, so a mood with no glow ends up wearing
        // another mood's glow — and only in the combined sheet.
        note(
          `themes/${theme.id}.css does not define ${v}; an optional role must still be ` +
            `declared (${contract.optionalAbsent?.[role] ?? "none"}) so it cannot inherit another theme's value`,
        );
      } else {
        note(`themes/${theme.id}.css does not define ${v}`);
      }
    }
    for (const v of declared) {
      if (!roleVars.has(v)) {
        note(`themes/${theme.id}.css defines ${v}, which is not in the role contract`);
      }
    }
  }

  // --- 7. every theme honours the contract's contrast guarantees -----------
  // A component pair that clears the bar in one theme can fail in another:
  // a pastel brand needs a long way to travel before it reads on its own
  // tint, a near-black one overshoots. This is where "adapts to every mood"
  // stops being a claim and becomes a measurement.
  for (const theme of index.themes ?? []) {
    const path = join(root, theme.file);
    if (!existsSync(path)) continue;
    const themeCss = stripComments(readFileSync(path, "utf8"));
    const vars = new Map();
    for (const m of themeCss.matchAll(/(--um-[a-z0-9-]+)\s*:\s*([^;]+);/g)) {
      vars.set(m[1], m[2].trim());
    }
    const page = parseColor(vars.get(`${prefix}-bg-page`) ?? "#ffffff");
    const get = (role) => {
      const raw = vars.get(`${prefix}-${role}`);
      // A transparent surface shows the page through it.
      return raw === "transparent" ? vars.get(`${prefix}-bg-page`) : raw;
    };
    for (const pair of contract.pairs ?? []) {
      const fg = get(pair.fg);
      const bg = get(pair.bg);
      const ratio = contrastRatio(fg, bg, page);
      if (ratio === null) {
        note(`themes/${theme.id}.css: ${pair.name} — ${pair.fg} on ${pair.bg} is not a measurable pair`);
        continue;
      }
      if (ratio < pair.min) {
        note(
          `themes/${theme.id}.css: ${pair.name} is ${ratio.toFixed(2)} < ${pair.min} ` +
            `(${pair.fg} on ${pair.bg})`,
        );
      }
    }
  }

  // --- 8. the documentation site is current -------------------------------
  // The site is generated, so this catches the case where a theme was added
  // and the site was not rebuilt: the switcher would silently be missing it.
  const sitePath = join(root, "site", "index.html");
  if (!existsSync(sitePath)) {
    note("site/index.html missing — run `ui-moods build-docs`");
  } else {
    const html = readFileSync(sitePath, "utf8");
    // The theme list is a JSON payload the generator inlines. Reading the
    // whole page for quoted words would pick up every HTML attribute value
    // as if it were a theme id.
    const payload = /window\.UM_THEMES\s*=\s*(\{[^;]*\});/.exec(html);
    if (!payload) {
      note("site/index.html has no theme list");
    } else {
      let listed = [];
      try {
        const parsed = JSON.parse(payload[1]);
        listed = [...(parsed.light ?? []), ...(parsed.dark ?? [])];
      } catch {
        note("site/index.html has an unreadable theme list");
      }
      const actual = (index.themes ?? []).map((t) => t.id);
      for (const id of actual) {
        if (!listed.includes(id)) note(`site/index.html does not list theme "${id}"`);
      }
      for (const id of listed) {
        if (!actual.includes(id)) note(`site/index.html lists unknown theme "${id}"`);
      }
    }
  }

  // --- 9. the generated artefacts are current ------------------------------
  // A stale stylesheet is invisible in a screenshot of one component and
  // wrong in every theme. The build assembles the sheet from the per
  // component partials, so the check assembles it again — in the same
  // catalogue order — and compares.
  const manifestDir = join(root, "components");
  if (existsSync(manifestDir)) {
    // The same order the builder writes: `_base.css` first, `_hooks.css`
    // last, the components in catalogue order in between.
    const sharedFiles = readdirSync(manifestDir)
      .filter((f) => f.startsWith("_") && f.endsWith(".css"))
      .sort();
    const shared = [
      ...sharedFiles.filter((f) => f === "_base.css"),
      ...sharedFiles.filter((f) => f !== "_base.css" && f !== "_hooks.css"),
    ].map((name) => readFileSync(join(manifestDir, name), "utf8").trim());

    const perComponent = [];
    for (const m of manifests) {
      const stylePath = join(manifestDir, m.id, m.style ?? "style.css");
      if (!existsSync(stylePath)) {
        note(`components/${m.id}/${m.style ?? "style.css"} is missing`);
        continue;
      }
      perComponent.push(readFileSync(stylePath, "utf8").trim());
    }
    const hooks = sharedFiles
      .filter((f) => f === "_hooks.css")
      .map((name) => readFileSync(join(manifestDir, name), "utf8").trim());

    // The box-model rule is generated from the manifests, and it sits between
    // the shared layer and the components. It is generated in one place, so
    // that the builder and this check cannot disagree about what it is.
    const expected = [
      ...shared,
      boxModelCss(manifests),
      ...perComponent,
      ...hooks,
    ].join("\n\n");
    const assembled = readFileSync(join(root, "components", "um-components.css"), "utf8");
    if (assembled.indexOf(expected) === -1) {
      note(
        "components/um-components.css is out of date — run `ui-moods build-components`",
      );
    }
  }

  // --- 10. every component has a documentation page ------------------------
  const cataloguePath = join(root, "components", "index.json");
  if (existsSync(cataloguePath)) {
    const catalogue = JSON.parse(readFileSync(cataloguePath, "utf8").replace(/^\uFEFF/, ""));
    const onDisk = readdirSync(manifestDir, { withFileTypes: true })
      .filter((d) => d.isDirectory() && existsSync(join(manifestDir, d.name, "manifest.json")))
      .map((d) => d.name)
      .sort();
    const listed = (catalogue.components ?? []).map((c) => c.id).sort();
    for (const id of onDisk) {
      if (!listed.includes(id)) note(`components/index.json does not list component "${id}"`);
    }
    for (const id of listed) {
      if (!onDisk.includes(id)) note(`components/index.json lists unknown component "${id}"`);
    }
    for (const c of catalogue.components ?? []) {
      if (!existsSync(join(root, c.doc))) {
        note(`${c.doc} is missing — run \`ui-moods build-docs\``);
      }
    }
  }

  return problems;
}
