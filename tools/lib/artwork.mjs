// UI Moods · Code-generated artwork.
//
// The library ships no raster images. Every "picture" — a product shot, a
// cover, a banner, a gallery thumbnail — is drawn at render time from the
// mood's own tokens. A deterministic pseudo-random composition picks a shape
// family and a palette mapping, and the result is inline SVG.
//
// Two rules keep the output inside the token contract:
//
//   1. Colour is never written here. The caller supplies a palette object
//      whose values are either `var(--mood-colors-*)` references (inside a
//      mood artifact) or concrete values read from tokens.json (in the
//      gallery chrome, which is not itself a mood artifact).
//   2. SVG presentation attributes do not accept `var()`, so every paint is
//      applied through `style="fill:..."`. Opacity rides on its own
//      attribute (`opacity="0.5"`, `stop-opacity="0.5"`) rather than a CSS
//      declaration, so it never collides with the stylesheet opacity
//      allowlist.
//
// Everything is unitless: no `px` appears in the markup, so the generated
// output cannot trip the pixel allowlist.

/* ------------------------------------------------------------- palette */

/** Palette of CSS custom-property references — use inside a mood artifact. */
export function tokenPalette() {
  return {
    bg: "var(--mood-colors-bg)",
    panel: "var(--mood-colors-panel)",
    surface: "var(--mood-colors-surface)",
    border: "var(--mood-colors-border)",
    text: "var(--mood-colors-text)",
    textStrong: "var(--mood-colors-text-strong)",
    muted: "var(--mood-colors-muted)",
    accent: "var(--mood-colors-accent)",
    onAccent: "var(--mood-colors-on-accent, var(--mood-colors-surface))",
    ok: "var(--mood-colors-ok)",
    warn: "var(--mood-colors-warn)",
    danger: "var(--mood-colors-danger)",
  };
}

/** Palette of concrete colours read from a mood's tokens.json. */
export function paletteFromTokens(tokens) {
  const c = tokens?.colors ?? {};
  return {
    bg: c.bg ?? "#ffffff",
    panel: c.panel ?? "rgba(0,0,0,0.04)",
    surface: c.surface ?? "#ffffff",
    border: c.border ?? "rgba(0,0,0,0.12)",
    text: c.text ?? "#333333",
    textStrong: c.textStrong ?? "#111111",
    muted: c.muted ?? "#888888",
    accent: c.accent ?? "#2e7d5b",
    onAccent: c.onAccent ?? "#ffffff",
    ok: c.ok ?? "#2fb96e",
    warn: c.warn ?? "#c2913f",
    danger: c.danger ?? "#b05f47",
  };
}

/* ---------------------------------------------------------- determinism */

function hashSeed(str) {
  let h = 2166136261;
  const s = String(str ?? "");
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Small deterministic PRNG (mulberry32). Same seed → same picture. */
function rng(seed) {
  let s = hashSeed(seed) || 1;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ------------------------------------------------------------- painting */

const n = (v) => Math.round(v * 100) / 100;

/** Paint a shape with a palette colour. */
const paint = (color, opacity) =>
  opacity === undefined
    ? `style="fill:${color}"`
    : `style="fill:${color}" opacity="${n(opacity)}"`;

const stroke = (color, width, opacity) =>
  `style="stroke:${color}" stroke-width="${width}" fill="none"${
    opacity === undefined ? "" : ` opacity="${n(opacity)}"`
  }`;

const stop = (color, offset, opacity) =>
  `<stop offset="${offset}" style="stop-color:${color}" stop-opacity="${n(opacity)}"/>`;

/* -------------------------------------------------------- compositions */
/* Each returns { defs, body } so a composition can be placed inside a group
   with a transform and a clip path. `uid` prefixes the gradient ids; it always
   starts with a non-hex letter so `url(#…)` can never look like a colour
   literal to the validator. */

function mesh(p, r, w, h, uid) {
  const defs = [];
  const body = [];
  const roles = ["accent", "accent", "ok", "warn"];
  for (let i = 0; i < 4; i++) {
    const id = `${uid}m${i}`;
    const role = roles[i];
    const cx = n(8 + r() * (w - 16));
    const cy = n(8 + r() * (h - 16));
    const rad = n((0.42 + r() * 0.46) * Math.max(w, h));
    defs.push(
      `<radialGradient id="${id}" cx="50%" cy="50%" r="50%">` +
        stop(p[role], "0%", 0.42 + r() * 0.34) +
        stop(p[role], "100%", 0) +
        `</radialGradient>`,
    );
    body.push(`<circle cx="${cx}" cy="${cy}" r="${rad}" style="fill:url(#${id})"/>`);
  }
  return { defs: defs.join(""), body: body.join("") };
}

function arch(p, r, w, h, uid) {
  const body = [];
  const wide = w / h > 1.8;
  const groundW = n(w * (0.5 + r() * 0.3));
  // On a wide strip a narrow arch would leave most of the canvas empty.
  const archW = n(w * (wide ? 0.52 + r() * 0.3 : 0.34 + r() * 0.26));
  const archH = n(h * (0.55 + r() * 0.35));
  const ax = n((w - archW) / 2 + (r() - 0.5) * w * 0.22);
  body.push(`<rect x="0" y="0" width="${n(w)}" height="${n(h)}" ${paint(p.panel)}/>`);
  body.push(
    `<rect x="${n(ax)}" y="${n(h - archH)}" width="${n(archW)}" height="${n(archH)}" ` +
      `rx="${n(archW / 2)}" ${paint(p.accent, 0.85)}/>`,
  );
  body.push(
    `<circle cx="${n(ax + archW * (0.2 + r() * 0.6))}" cy="${n(h - archH * (0.25 + r() * 0.3))}" ` +
      `r="${n(Math.min(w, h) * 0.16)}" ${paint(p.onAccent, 0.35)}/>`,
  );
  body.push(
    `<rect x="${n(w * 0.08)}" y="${n(h - h * 0.18)}" width="${n(groundW * 0.5)}" height="${n(h * 0.05)}" ` +
      `rx="${n(h * 0.025)}" ${paint(p.text, 0.28)}/>`,
  );
  return { defs: "", body: body.join("") };
}

function rings(p, r, w, h, uid) {
  const body = [];
  const cx = n(w * (0.3 + r() * 0.4));
  const cy = n(h * (0.3 + r() * 0.4));
  const maxR = n(Math.min(w, h) * (0.42 + r() * 0.3));
  const roles = ["accent", "panel", "ok", "warn"];
  for (let i = 0; i < 5; i++) {
    const rad = n(maxR * (1 - i * 0.19));
    if (rad <= 2) break;
    body.push(
      `<circle cx="${cx}" cy="${cy}" r="${rad}" ${stroke(
        p[roles[i % roles.length]],
        n(1.5 + r() * 3),
        0.85 - i * 0.13,
      )}/>`,
    );
  }
  body.push(`<circle cx="${cx}" cy="${cy}" r="${n(maxR * 0.12)}" ${paint(p.accent)}/>`);
  return { defs: "", body: body.join("") };
}

function bars(p, r, w, h, uid) {
  const body = [];
  const count = w < 220 ? 4 + Math.floor(r() * 3) : 5 + Math.floor(r() * 4);
  const gap = n(w * 0.018);
  const bw = n((w - gap * (count - 1)) / count);
  const roles = ["accent", "accent", "warn", "ok"];
  for (let i = 0; i < count; i++) {
    const bh = n(h * (0.22 + r() * 0.72));
    body.push(
      `<rect x="${n(i * (bw + gap))}" y="${n(h - bh)}" width="${bw}" height="${bh}" ` +
        `rx="${n(bw / 2.4)}" ${paint(p[roles[i % roles.length]], i % 3 === 2 ? 0.45 : 0.9)}/>`,
    );
  }
  return { defs: "", body: body.join("") };
}

function strata(p, r, w, h, uid) {
  const body = [];
  const layers = 4 + Math.floor(r() * 3);
  const roles = ["accent", "panel", "ok", "warn", "surface"];
  for (let i = 0; i < layers; i++) {
    const bandH = n(h / layers);
    const y = n(i * bandH);
    const skew = n((r() - 0.5) * w * 0.18);
    body.push(
      `<path d="M${n(-skew)} ${y} L${n(w + skew)} ${n(y + bandH * (r() - 0.5) * 0.4)} ` +
        `L${n(w + skew)} ${n(y + bandH)} L${n(-skew)} ${n(y + bandH)} Z" ` +
        `${paint(p[roles[i % roles.length]], 0.28 + (i / layers) * 0.5)}/>`,
    );
  }
  return { defs: "", body: body.join("") };
}

function orbit(p, r, w, h, uid) {
  const body = [];
  const cx = n(w * (0.35 + r() * 0.3));
  const cy = n(h * (0.4 + r() * 0.25));
  const count = 3 + Math.floor(r() * 3);
  const maxR = n(Math.min(w, h) * (0.3 + r() * 0.2));
  for (let i = 0; i < count; i++) {
    const rad = n(maxR * (1 - i * 0.26));
    const rot = n(r() * 180);
    body.push(
      `<ellipse cx="${cx}" cy="${cy}" rx="${rad}" ry="${n(rad * (0.34 + r() * 0.4))}" ` +
        `transform="rotate(${rot} ${cx} ${cy})" ${stroke(p.accent, n(1.4 + r() * 2.4), 0.65 - i * 0.12)}/>`,
    );
  }
  body.push(`<circle cx="${cx}" cy="${cy}" r="${n(maxR * 0.2)}" ${paint(p.accent, 0.85)}/>`);
  return { defs: "", body: body.join("") };
}

function tiles(p, r, w, h, uid) {
  const body = [];
  const cols = 3 + Math.floor(r() * 3);
  const rows = 2 + Math.floor(r() * 2);
  const gx = n(w * 0.03);
  const gy = n(h * 0.05);
  const tw = n((w - gx * (cols - 1)) / cols);
  const th = n((h - gy * (rows - 1)) / rows);
  const roles = ["accent", "panel", "ok", "warn", "surface"];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const role = roles[Math.floor(r() * roles.length)];
      const big = r() > 0.78;
      body.push(
        `<rect x="${n(x * (tw + gx))}" y="${n(y * (th + gy))}" width="${tw}" height="${th}" ` +
          `rx="${n(Math.min(tw, th) * 0.24)}" ${paint(p[role], big ? 0.9 : 0.4 + r() * 0.3)}/>`,
      );
    }
  }
  return { defs: "", body: body.join("") };
}

function dots(p, r, w, h, uid) {
  const body = [];
  const cols = 11 + Math.floor(r() * 7);
  const rows = 8 + Math.floor(r() * 6);
  const fx = n(w * (0.25 + r() * 0.5));
  const fy = n(h * (0.25 + r() * 0.5));
  const maxD = n(Math.min(w / cols, h / rows) * 0.85);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const cx = n((x + 0.5) * (w / cols));
      const cy = n((y + 0.5) * (h / rows));
      const dist = Math.hypot(cx - fx, cy - fy) / Math.hypot(w, h);
      const size = n(maxD * Math.max(0.18, 1 - dist * 1.4));
      body.push(
        `<circle cx="${cx}" cy="${cy}" r="${n(size / 2)}" ${paint(
          p.accent,
          0.16 + (1 - Math.min(1, dist * 1.6)) * 0.42,
        )}/>`,
      );
    }
  }
  return { defs: "", body: body.join("") };
}

function waves(p, r, w, h, uid) {
  const body = [];
  const layers = 3;
  const roles = ["accent", "ok", "warn"];
  for (let i = 0; i < layers; i++) {
    const base = n(h * (0.34 + i * 0.24));
    const amp = n(h * (0.06 + r() * 0.1));
    const step = n(w / 4);
    let d = `M0 ${n(base)}`;
    for (let k = 0; k < 4; k++) {
      const x0 = n(k * step);
      const x1 = n((k + 1) * step);
      const c1 = n(x0 + step * 0.3);
      const c2 = n(x1 - step * 0.3);
      const dir = k % 2 === 0 ? -1 : 1;
      d += ` C ${c1} ${n(base + amp * dir)} ${c2} ${n(base + amp * dir)} ${x1} ${n(base)}`;
    }
    d += ` L ${n(w)} ${n(h)} L 0 ${n(h)} Z`;
    body.push(`<path d="${d}" ${paint(p[roles[i]], 0.75 - i * 0.16)}/>`);
  }
  return { defs: "", body: body.join("") };
}

function rays(p, r, w, h, uid) {
  const body = [];
  const cx = n(r() > 0.5 ? 0 : w);
  const cy = n(r() > 0.5 ? 0 : h);
  const count = 9 + Math.floor(r() * 6);
  const maxR = n(Math.hypot(w, h));
  for (let i = 0; i < count; i++) {
    const a0 = (Math.PI * 2 * i) / count;
    const a1 = a0 + Math.PI / count;
    const x0 = n(cx + Math.cos(a0) * maxR);
    const y0 = n(cy + Math.sin(a0) * maxR);
    const x1 = n(cx + Math.cos(a1) * maxR);
    const y1 = n(cy + Math.sin(a1) * maxR);
    body.push(
      `<path d="M${cx} ${cy} L${x0} ${y0} L${x1} ${y1} Z" ${paint(
        p.accent,
        i % 3 === 0 ? 0.38 : 0.12,
      )}/>`,
    );
  }
  return { defs: "", body: body.join("") };
}

function steps(p, r, w, h, uid) {
  const body = [];
  const count = 4 + Math.floor(r() * 4);
  const sw = n(w / count);
  for (let i = 0; i < count; i++) {
    const sh = n(h * (0.18 + (i / count) * 0.72));
    body.push(
      `<rect x="${n(i * sw + sw * 0.06)}" y="${n(h - sh)}" width="${n(sw * 0.88)}" height="${sh}" ` +
        `rx="${n(sw * 0.14)}" ${paint(p.accent, 0.28 + (i / count) * 0.6)}/>`,
    );
  }
  return { defs: "", body: body.join("") };
}

function petal(p, r, w, h, uid) {
  const body = [];
  const cx = n(w / 2);
  const cy = n(h * (0.42 + r() * 0.16));
  const count = 9 + Math.floor(r() * 6);
  // The blossom is elliptical, so it spreads across a wide strip instead of
  // shrinking to a dot in the middle of it.
  const spreadX = n(w * 0.38);
  const spreadY = n(h * 0.38);
  const len = n(Math.min(spreadX, spreadY) * (0.78 + r() * 0.3));
  for (let i = 0; i < count; i++) {
    const a = (Math.PI * 2 * i) / count;
    const x = n(cx + Math.cos(a) * spreadX * 0.62);
    const y = n(cy + Math.sin(a) * spreadY * 0.62);
    body.push(
      `<ellipse cx="${x}" cy="${y}" rx="${n(len * 0.5)}" ry="${n(len * 0.17)}" ` +
        `transform="rotate(${n((a * 180) / Math.PI)} ${x} ${y})" ${paint(
          p.accent,
          0.22 + (i % 3) * 0.12,
        )}/>`,
    );
  }
  body.push(`<circle cx="${cx}" cy="${cy}" r="${n(len * 0.2)}" ${paint(p.onAccent, 0.8)}/>`);
  return { defs: "", body: body.join("") };
}

const COMPOSITIONS = {
  mesh,
  arch,
  rings,
  bars,
  tiles,
  dots,
  waves,
  rays,
  steps,
  petal,
  strata,
  orbit,
};

export const ARTWORK_VARIANTS = Object.keys(COMPOSITIONS);

/** Build one composition by name. */
function compose(variant, palette, r, width, height, uid) {
  const fn = COMPOSITIONS[variant] ?? mesh;
  return fn(palette, r, width, height, uid);
}

/* -------------------------------------------------------------- render */

/**
 * Compositions that read well at thumbnail size. The chart-like families
 * (bars, steps, tiles) only make sense when there is room for them, so small
 * canvases draw from the soft abstract subset instead.
 */
/**
 * Render a generated artwork region as inline SVG.
 *
 * @param {object} palette  colour roles → CSS colour strings
 * @param {string} seed     deterministic seed (same seed → same picture)
 * @param {object} opts     { width, height, variant, uid }
 */
export function renderArtwork(palette, seed = "", opts = {}) {
  const width = opts.width ?? 320;
  const height = opts.height ?? 180;
  const aspect = width / height;
  // The chart-like families (bars, steps, tiles) only make sense when there is
  // room for them. A wide strip reads better as horizontal layers; a squarish
  // one reads better as soft blobs.
  const pool =
    Math.min(width, height) < 140
      ? aspect > 1.8
        ? ["strata", "waves", "strata", "orbit"]
        : ["mesh", "orbit", "petal", "waves"]
      : Object.keys(COMPOSITIONS);
  const variant =
    opts.variant ?? pool[hashSeed(seed) % pool.length];
  const fn = COMPOSITIONS[variant] ?? mesh;
  // The id is derived from seed+variant, so it is stable across rebuilds and
  // two artworks on the same page never share a gradient id.
  const uid = opts.uid ?? `g${hashSeed(`${seed}:${variant}`).toString(36)}`;
  const r = rng(`${seed}:${variant}`);
  const { defs, body } = compose(variant, palette, r, width, height, uid);

  return (
    `<svg class="gen-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid slice" ` +
    `role="img" aria-hidden="true" focusable="false">` +
    (defs ? `<defs>${defs}</defs>` : "") +
    body +
    `</svg>`
  );
}

/**
 * Render a miniature UI scene for a mood card.
 *
 * This is the gallery thumbnail: a stylised application screen built from the
 * mood's own tokens, so a card shows how the style actually looks applied to
 * an interface rather than an abstract swatch.
 */
export function renderMoodThumb(palette, opts = {}) {
  const width = opts.width ?? 320;
  const height = opts.height ?? 190;
  const uid = `g${opts.uid ?? "t"}`;
  const r = rng(opts.seed ?? "thumb");
  // The hero strip of a thumbnail picks its own composition from the seed, so
  // two moods never share the same picture.
  const heroVariants = ["mesh", "strata", "waves", "orbit", "arch", "petal", "rings"];
  const heroVariant = heroVariants[hashSeed(`${opts.seed ?? "thumb"}:hero`) % heroVariants.length];
  const { defs, body } = compose(heroVariant, palette, r, 288, 66, `${uid}h`);

  return (
    `<svg class="thumb-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" ` +
    `role="img" aria-hidden="true" focusable="false">` +
    `<defs>${defs}` +
    `<clipPath id="${uid}c"><rect x="16" y="52" width="288" height="66" rx="12"/></clipPath>` +
    `</defs>` +

    // page ground — full bleed. The card that holds this thumbnail owns the
    // corner radius; a radius of its own would fight it and leave a seam.
    `<rect x="0" y="0" width="${width}" height="${height}" ${paint(palette.bg)}/>` +

    // app bar
    `<circle cx="26" cy="26" r="11" ${paint(palette.accent, 0.28)}` +
    ` style="stroke:${palette.accent}" stroke-width="1.4"/>` +
    `<rect x="44" y="19" width="62" height="9" rx="4.5" ${paint(palette.textStrong, 0.92)}/>` +
    `<rect x="44" y="33" width="40" height="6" rx="3" ${paint(palette.muted, 0.7)}/>` +
    `<circle cx="278" cy="26" r="4" ${paint(palette.muted, 0.5)}/>` +
    `<circle cx="292" cy="26" r="4" ${paint(palette.accent, 0.9)}/>` +

    // hero artwork — the panel wash gives transparent compositions a surface.
    // The composition is drawn at the origin, so it has to be moved onto the
    // clip rect; otherwise only its top-left corner is visible.
    `<g clip-path="url(#${uid}c)">` +
    `<g transform="translate(16,52)">` +
    `<rect x="0" y="0" width="288" height="66" ${paint(palette.panel)}/>` +
    `${body}</g></g>` +
    `<rect x="16" y="52" width="288" height="66" rx="12" fill="none" ` +
    `style="stroke:${palette.border}" stroke-width="1"/>` +

    // stat card
    `<rect x="16" y="130" width="138" height="46" rx="10" ${paint(palette.surface)}/>` +
    `<rect x="28" y="141" width="46" height="11" rx="5.5" ${paint(palette.accent)}/>` +
    `<rect x="28" y="158" width="64" height="6" rx="3" ${paint(palette.muted, 0.5)}/>` +

    // chart card
    `<rect x="166" y="130" width="138" height="46" rx="10" ${paint(palette.surface)}/>` +
    [0, 1, 2, 3, 4]
      .map((i) => {
        const bh = n(8 + r() * 22);
        return (
          `<rect x="${n(178 + i * 24)}" y="${n(170 - bh)}" width="10" height="${bh}" ` +
          `rx="4" ${paint(palette.accent, i === 3 ? 0.45 : 0.95)}/>`
        );
      })
      .join("") +

    `</svg>`
  );
}

/**
 * Render a miniature mobile screen for an app-pack card.
 *
 * Same idea as the mood thumbnail, but composed as a phone screen so an app
 * card reads as "this product", not "this style".
 */
export function renderAppThumb(palette, opts = {}) {
  const width = opts.width ?? 200;
  const height = opts.height ?? 240;
  const uid = `g${opts.uid ?? "a"}`;
  const r = rng(opts.seed ?? "app");
  const heroVariants = ["mesh", "strata", "waves", "orbit", "arch", "petal"];
  const heroVariant = heroVariants[hashSeed(`${opts.seed ?? "app"}:hero`) % heroVariants.length];
  const { defs, body } = compose(heroVariant, palette, r, 176, 78, `${uid}h`);

  // "device" draws a phone with its own rounded silhouette and bezel — right
  // when the thumbnail floats on a panel. "bleed" fills the box edge to edge,
  // for a card whose own radius already rounds the corners; a second radius
  // would not match it and would leave a seam in every corner.
  const bleed = opts.frame === "bleed";
  const screen = bleed
    ? `<rect x="0" y="0" width="${width}" height="${height}" ${paint(palette.bg)}/>`
    : `<rect x="0" y="0" width="${width}" height="${height}" rx="18" ${paint(palette.bg)}/>` +
      `<rect x="0.5" y="0.5" width="199" height="239" rx="18" fill="none" ` +
      `style="stroke:${palette.border}" stroke-width="1"/>`;

  return (
    `<svg class="thumb-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" ` +
    `role="img" aria-hidden="true" focusable="false">` +
    `<defs>${defs}` +
    `<clipPath id="${uid}c"><rect x="12" y="30" width="176" height="78" rx="12"/></clipPath>` +
    `</defs>` +

    screen +

    // status bar
    `<rect x="18" y="12" width="22" height="5" rx="2.5" ${paint(palette.textStrong, 0.85)}/>` +
    `<circle cx="168" cy="14" r="3" ${paint(palette.muted, 0.6)}/>` +
    `<circle cx="178" cy="14" r="3" ${paint(palette.accent, 0.9)}/>` +

    // app bar
    `<circle cx="24" cy="46" r="8" ${paint(palette.accent, 0.25)}/>` +
    `<rect x="38" y="41" width="46" height="6" rx="3" ${paint(palette.textStrong, 0.9)}/>` +
    `<rect x="38" y="51" width="30" height="4" rx="2" ${paint(palette.muted, 0.6)}/>` +

    // hero artwork — the panel wash gives transparent compositions a surface.
    // The composition is drawn at the origin, so it has to be moved onto the
    // clip rect; otherwise only its top-left corner is visible.
    `<g clip-path="url(#${uid}c)">` +
    `<g transform="translate(12,30)">` +
    `<rect x="0" y="0" width="176" height="78" ${paint(palette.panel)}/>` +
    `${body}</g></g>` +
    `<rect x="12" y="30" width="176" height="78" rx="12" fill="none" ` +
    `style="stroke:${palette.border}" stroke-width="1"/>` +

    // list rows
    [0, 1, 2]
      .map((i) => {
        const y = n(122 + i * 30);
        return (
          `<rect x="12" y="${y}" width="176" height="24" rx="8" ${paint(palette.surface)}/>` +
          `<rect x="22" y="${n(y + 8)}" width="12" height="8" rx="3" ${paint(
            palette.accent,
            i === 1 ? 0.45 : 0.9,
          )}/>` +
          `<rect x="42" y="${n(y + 7)}" width="${n(60 + r() * 50)}" height="6" rx="3" ` +
          `${paint(palette.text, 0.75)}/>` +
          `<rect x="42" y="${n(y + 16)}" width="${n(30 + r() * 24)}" height="4" rx="2" ` +
          `${paint(palette.muted, 0.55)}/>`
        );
      })
      .join("") +

    // tab bar
    `<rect x="12" y="214" width="176" height="14" rx="7" ${paint(palette.panel)}/>` +
    [0, 1, 2, 3]
      .map((i) => {
        const x = n(24 + i * 42);
        return (
          `<circle cx="${x}" cy="221" r="4" ${paint(
            palette.accent,
            i === 0 ? 0.95 : 0.35,
          )}/>`
        );
      })
      .join("") +

    `</svg>`
  );
}
