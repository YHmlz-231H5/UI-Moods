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

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { contrastRatio, parseColor } from "./state-colors.mjs";

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
  const browserPath = join(root, "components", "index.html");

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

  // --- 1. the component layer reads only known variables -------------------
  for (const v of usedVars(css)) {
    if (!known.has(v)) {
      note(`components/um-components.css reads ${v}, which no theme defines`);
    }
  }

  // --- 2. the component layer declares every constant ----------------------
  const cssVars = declaredVars(css);
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
      if (optional.has(role)) continue;
      const v = `${prefix}-${role}`;
      if (!declared.has(v)) note(`themes/${theme.id}.css does not define ${v}`);
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

  // --- 8. the browser lists exactly the themes that exist -------------------
  if (existsSync(browserPath)) {
    const html = readFileSync(browserPath, "utf8");
    const listed = [];
    for (const m of html.matchAll(/const (?:LIGHT|DARK)\s*=\s*\[([^\]]*)\]/g)) {
      for (const id of m[1].matchAll(/"([a-z0-9-]+)"/g)) listed.push(id[1]);
    }
    if (!listed.length) {
      note("components/index.html has no theme list");
    }
    const actual = (index.themes ?? []).map((t) => t.id);
    for (const id of actual) {
      if (!listed.includes(id)) note(`components/index.html does not list theme "${id}"`);
    }
    for (const id of listed) {
      if (!actual.includes(id)) note(`components/index.html lists unknown theme "${id}"`);
    }
  }

  return problems;
}
