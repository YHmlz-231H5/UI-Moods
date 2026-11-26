// UI Moods · state fill foregrounds.
//
// A solid state chip (a badge on an `ok` / `warn` / `danger` / `accent` fill)
// needs a foreground that is actually readable on that fill. The mood's own
// palette may not contain one — a light amber `warn` with a white `onAccent`
// is unreadable — so this module derives one.
//
// The rule is mechanical, not taste:
//   1. take the mood's opaque palette tokens as candidates;
//   2. keep the one with the highest WCAG contrast against the fill;
//   3. if it still misses the target, move it toward black or white until it
//      passes.
//
// The result is a plain hex the mood stores as a token, so nothing downstream
// has to derive anything at render time.

/** The contract minimum: a state foreground must reach this against its fill. */
const TARGET = 4.5;

/**
 * The target the derivation actually aims for.
 *
 * Deriving exactly at the contract line leaves no margin: the first pass put
 * 17 of 128 shipped pairs within 0.05 of 4.5, so a fill nudged a shade darker
 * would drop them under the line. Aiming a little higher costs at most one
 * blend step and is visually indistinguishable.
 */
const DERIVE_TARGET = 4.6;

/** Parse #rgb / #rrggbb / rgb() / rgba() into an opaque-able colour. */
export function parseColor(str) {
  const s = String(str).trim();
  let m;
  if ((m = s.match(/^#([0-9a-fA-F]{3})$/))) {
    const [r, g, b] = [...m[1]].map((c) => parseInt(c + c, 16));
    return { r, g, b, a: 1 };
  }
  if ((m = s.match(/^#([0-9a-fA-F]{6})$/))) {
    return {
      r: parseInt(m[1].slice(0, 2), 16),
      g: parseInt(m[1].slice(2, 4), 16),
      b: parseInt(m[1].slice(4, 6), 16),
      a: 1,
    };
  }
  if (
    (m = s.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i))
  ) {
    return {
      r: Number(m[1]),
      g: Number(m[2]),
      b: Number(m[3]),
      a: m[4] === undefined ? 1 : Number(m[4]),
    };
  }
  return null;
}

const composite = (fg, bg) => ({
  r: fg.r * fg.a + bg.r * (1 - fg.a),
  g: fg.g * fg.a + bg.g * (1 - fg.a),
  b: fg.b * fg.a + bg.b * (1 - fg.a),
  a: 1,
});

export function luminance({ r, g, b }) {
  const lin = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** WCAG contrast ratio between two colour strings, compositing over `base`. */
export function contrastRatio(fgRaw, bgRaw, base = { r: 255, g: 255, b: 255, a: 1 }) {
  const fg = parseColor(fgRaw);
  const bg = parseColor(bgRaw);
  if (!fg || !bg) return null;
  const bgOpaque = bg.a < 1 ? composite(bg, base) : bg;
  const fgOpaque = fg.a < 1 ? composite(fg, bgOpaque) : fg;
  const l1 = luminance(fgOpaque);
  const l2 = luminance(bgOpaque);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

const toHex = ({ r, g, b }) =>
  `#${[r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("")}`;

/** Blend a colour toward black (t=0) or white (t=1). */
function blend(color, t) {
  const target = t > 0.5 ? 255 : 0;
  const k = t > 0.5 ? (t - 0.5) * 2 : 1 - t * 2;
  return {
    r: color.r + (target - color.r) * k,
    g: color.g + (target - color.g) * k,
    b: color.b + (target - color.b) * k,
    a: 1,
  };
}

/**
 * Derive a foreground that reaches `target` contrast on `fillRaw`.
 *
 * @param {string} fillRaw    the state colour the text sits on
 * @param {string[]} seeds    candidate foreground colours from the mood palette
 * @param {object} base       opaque backdrop used to composite translucent colours
 * @returns {{hex: string, ratio: number, seed: string}}
 */
export function readableForeground(fillRaw, seeds, base, target = TARGET) {
  const fill = parseColor(fillRaw);
  if (!fill) return null;
  const fillHex = toHex(fill);

  const scored = seeds
    .filter(Boolean)
    .map((seed) => ({ seed, ratio: contrastRatio(seed, fillHex, base) }))
    .filter((x) => x.ratio !== null)
    .sort((a, b) => b.ratio - a.ratio);

  if (!scored.length) return null;
  const best = scored[0];
  if (best.ratio >= target) return { hex: best.seed, ratio: best.ratio, seed: best.seed };

  // The best candidate is still short — move it away from the fill until it
  // clears the bar. The direction that grows the gap first is the one that
  // starts on the far side of the fill; the other direction is tried as a
  // fallback, because a mid-luminance fill can be left behind only by
  // crossing it.
  const seed = parseColor(best.seed);
  const seedLum = luminance(seed);
  const fillLum = luminance(fill);
  const away = seedLum < fillLum ? -1 : 1;
  for (const dir of [away, -away]) {
    for (let i = 0; i <= 100; i++) {
      const k = i / 100;
      const t = dir < 0 ? 0.5 - k * 0.5 : 0.5 + k * 0.5;
      const hex = toHex(blend(seed, t));
      const ratio = contrastRatio(hex, fillHex, base);
      if (ratio !== null && ratio >= target) {
        return { hex, ratio, seed: best.seed };
      }
    }
  }
  const fallback = toHex(blend(seed, away < 0 ? 0 : 1));
  return {
    hex: fallback,
    ratio: contrastRatio(fallback, fillHex, base),
    seed: best.seed,
  };
}

/** The state fills a mood exposes, and the token each one's foreground is named after. */
export const STATE_FILLS = [
  { state: "accent", fill: "accent", on: "onAccentSolid" },
  { state: "ok", fill: "ok", on: "onOkSolid" },
  { state: "warn", fill: "warn", on: "onWarnSolid" },
  { state: "danger", fill: "danger", on: "onDangerSolid" },
];

/** The palette tokens that may serve as a foreground. */
export const FOREGROUND_SEEDS = ["onAccent", "textStrong", "text", "surface", "bg", "panel"];

/**
 * Give a mood its state foregrounds and its badge/alert semantic layer.
 *
 * Idempotent: running it again on the same colours yields the same tokens, so
 * it is safe to call from the scaffolder and from a build.
 */
export function applyStateLayer(tokens) {
  const c = tokens.colors;
  const base = parseColor(c.bg) ?? { r: 255, g: 255, b: 255, a: 1 };
  const seeds = FOREGROUND_SEEDS.map((k) => c[k]).filter(Boolean);

  for (const { fill, on } of STATE_FILLS) {
    const got = readableForeground(c[fill], seeds, base, DERIVE_TARGET);
    if (!got) throw new Error(`cannot derive ${on} for mood ${tokens.id ?? "?"}`);
    c[on] = got.hex;
  }

  const badge = {
    neutral: {
      bg: "{colors.panel}",
      fg: "{colors.text}",
      border: "{colors.border}",
      radius: "{radii.badge}",
    },
  };
  const alert = {
    neutral: {
      bg: "{colors.panel}",
      fg: "{colors.text}",
      border: "{colors.border}",
    },
  };
  for (const { state, fill, on } of STATE_FILLS) {
    badge[state] = {
      bg: `{colors.${fill}}`,
      fg: `{colors.${on}}`,
      border: `{colors.${fill}}`,
      radius: "{radii.badge}",
    };
    alert[state] = {
      bg: "{colors.panel}",
      fg: "{colors.text}",
      border: `{colors.${fill}}`,
    };
  }
  tokens.components = { ...tokens.components, badge, alert };
  return tokens;
}
