// ui-moods · contrast audit
//
// Prints the measured contrast of every role pair across every mood.
//
// The contract in `tokens/roles.json` says what has to hold; this says what
// actually holds, so a decision about a new role is made on numbers rather
// on a guess.
//
//   node tools/audit-contrast.mjs                       # the contract's own pairs
//   node tools/audit-contrast.mjs color-primary bg-container bg-page
//
// A pair that is not in the contract can still be measured by naming it on
// the command line. The exit code is 1 when a contract pair falls short, so
// the tool can be used as a gate.

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadContract } from "./lib/theme.mjs";
import { parseColor } from "./lib/ramp.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const contract = loadContract(join(root, "tokens", "roles.json"));
const prefix = contract.prefix ?? "--um";

/** @returns {number | null} the WCAG contrast ratio */
function ratio(fgRaw, bgRaw, page) {
  const fg = parseColor(fgRaw);
  const bg = parseColor(bgRaw);
  if (!fg || !bg) return null;
  const flat = (c) =>
    c.a >= 1
      ? c
      : { r: c.r * c.a + page.r * (1 - c.a), g: c.g * c.a + page.g * (1 - c.a), b: c.b * c.a + page.b * (1 - c.a), a: 1 };
  const l = (c) => {
    const f = (v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  };
  const a = l(flat(fg));
  const b = l(flat(bg));
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

const index = JSON.parse(readFileSync(join(root, "themes", "index.json"), "utf8").replace(/^\uFEFF/, ""));

/** Every theme's resolved role values. */
const themes = [];
for (const t of index.themes ?? []) {
  const path = join(root, t.file);
  if (!existsSync(path)) continue;
  const css = readFileSync(path, "utf8");
  const vars = new Map();
  for (const m of css.matchAll(/(--um-[a-z0-9-]+)\s*:\s*([^;]+);/g)) vars.set(m[1], m[2].trim());
  const page = parseColor(vars.get(`${prefix}-bg-page`) ?? "#ffffff") ?? { r: 255, g: 255, b: 255, a: 1 };
  themes.push({ id: t.id, vars, page });
}

// --- which pairs to measure --------------------------------------------------
const asked = process.argv.slice(2);
let pairs;
if (asked.length >= 2) {
  // A fg role and one or more bg roles, measured on every theme.
  const fg = asked[0];
  const bgs = asked.slice(1);
  pairs = bgs.map((bg) => ({ name: `${fg} on ${bg}`, fg, bg, min: 3 }));
} else {
  pairs = contract.pairs ?? [];
}

let failed = 0;
for (const pair of pairs) {
  const numbers = [];
  let worst = Infinity;
  let worstTheme = null;
  for (const t of themes) {
    const get = (role) => {
      const raw = t.vars.get(`${prefix}-${role}`);
      if (raw === undefined) return undefined;
      return raw === "transparent" ? t.vars.get(`${prefix}-bg-page`) : raw;
    };
    const fg = get(pair.fg);
    const bg = get(pair.bg);
    if (fg === undefined || bg === undefined) continue;
    const r = ratio(fg, bg, t.page);
    if (r === null) continue;
    numbers.push({ id: t.id, r });
    if (r < worst) {
      worst = r;
      worstTheme = t.id;
    }
  }
  const ok = worst >= pair.min;
  if (!ok) failed++;
  const line = `${ok ? "ok  " : "FAIL"} ${pair.name.padEnd(38)} min ${pair.min}  worst ${worst.toFixed(2)} (${worstTheme})`;
  console.log(line);
  if (!ok) {
    const bad = numbers.filter((n) => n.r < pair.min).map((n) => `${n.id}:${n.r.toFixed(2)}`);
    console.log(`       failing: ${bad.join(" ")}`);
  }
}

process.exit(failed ? 1 : 0);
