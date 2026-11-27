// UI Moods · colour ramp engine.
//
// Derives the component library's derived roles from a mood's own palette.
//
// The one rule that makes 32 themes work: never mix toward a fixed colour.
// Element Plus writes `light-3: mix(white, primary, 30%)` because it has one
// light theme plus a hand-written dark file. Our moods include 14 dark ones,
// where "mix with white" is wrong — a hover state would end up lighter than
// the page it sits on. So every mix is anchored to the theme's own background
// or text colour:
//
//   soft-N  = mix(base, bg-page, N/10)   → recedes toward the page
//   strong  = mix(base, text-primary, 0.2) → moves toward the text
//
// On a light theme the first is a pale tint and the second is a darker shade.
// On a dark theme the first is a deep tint of the same hue and the second is
// brighter. One formula, 32 moods.

import { parseColor, contrastRatio, readableForeground, luminance } from "./state-colors.mjs";

/** Quantise a colour to an 8-bit hex. */
export function toHex({ r, g, b }) {
  const c = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

/** Composite a translucent colour over an opaque backdrop. */
export function flatten(color, backdrop) {
  if (!color) return null;
  if (color.a >= 1) return { r: color.r, g: color.g, b: color.b, a: 1 };
  return {
    r: color.r * color.a + backdrop.r * (1 - color.a),
    g: color.g * color.a + backdrop.g * (1 - color.a),
    b: color.b * color.a + backdrop.b * (1 - color.a),
    a: 1,
  };
}

/**
 * Mix two colours.
 *
 * @param {string} baseRaw   the colour being adjusted
 * @param {string} mixRaw    the colour it is moved toward
 * @param {number} weight   how much of `mix` ends up in the result (0–1)
 * @param {object} backdrop opaque colour the base is composited over first
 */
export function mix(baseRaw, mixRaw, weight, backdrop) {
  // A transparent base stays transparent: a mood may declare `border:
  // transparent` (clay does), and a border that blends into the page cannot be
  // mixed into a visible tint.
  if (String(baseRaw).trim() === "transparent") return "transparent";
  const base = parseColor(baseRaw);
  const target = parseColor(mixRaw);
  if (!base || !target) return null;
  const b = flatten(base, backdrop);
  const t = flatten(target, backdrop);
  if (!b || !t) return null;
  const w = Math.max(0, Math.min(1, weight));
  return toHex({
    r: b.r + (t.r - b.r) * w,
    g: b.g + (t.g - b.g) * w,
    b: b.b + (t.b - b.b) * w,
  });
}

/**
 * Mix two colours until a contrast condition holds.
 *
 * A fixed blend weight cannot work across 32 moods: a pastel brand colour
 * needs a long way to travel before it reads on its own tint, while a
 * near-black one overshoots immediately. So the weight is *derived* from the
 * contrast requirement instead of being guessed.
 *
 * @param {object} spec
 *   base     the colour to move
 *   toward   the colour it moves toward
 *   against  the reference the result is compared with — one colour, or a
 *            list of surfaces the role must read on (a brand colour used as
 *            text has to read on the page *and* on a floating surface)
 *   target   the contrast ratio to reach
 *   mode     "atleast" — the smallest move that reaches the target
 *            "atmost"  — the largest move that still reaches the target
 */
export function mixUntil(spec, backdrop) {
  const { base, toward, against, target, mode } = spec;
  const b = parseColor(base);
  const t = parseColor(toward);
  const references = (Array.isArray(against) ? against : [against]).map(parseColor);
  if (!b || !t || references.some((x) => !x)) return null;

  const backdropOpaque = backdrop ?? { r: 255, g: 255, b: 255, a: 1 };
  const flat = (c) => (c.a >= 1 ? c : {
    r: c.r * c.a + backdropOpaque.r * (1 - c.a),
    g: c.g * c.a + backdropOpaque.g * (1 - c.a),
    b: c.b * c.a + backdropOpaque.b * (1 - c.a),
    a: 1,
  });
  const bFlat = flat(b);
  const tFlat = flat(t);
  const aFlats = references.map(flat);

  const blended = (w) => ({
    r: bFlat.r + (tFlat.r - bFlat.r) * w,
    g: bFlat.g + (tFlat.g - bFlat.g) * w,
    b: bFlat.b + (tFlat.b - bFlat.b) * w,
    a: 1,
  });
  const lum = (c) => luminance(c);
  const ratioBetween = (x, y) => {
    const l1 = lum(x);
    const l2 = lum(y);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  };
  /** The colour reads on every reference surface. */
  const holds = (c) => aFlats.every((a) => ratioBetween(c, a) >= target);
  const worstAgainst = (c) => Math.min(...aFlats.map((a) => ratioBetween(c, a)));

  const STEPS = 100;

  if (mode === "atmost") {
    // "as far as it can go and still hold" — a fade toward a surface, so it
    // only ever moves in one direction.
    let best = null;
    let first = null;
    for (let i = 0; i <= STEPS; i++) {
      const w = i / STEPS;
      const hex = toHex(blended(w));
      if (i === 0) first = hex;
      if (holds(parseColor(hex))) {
        best = hex;
        continue;
      }
      break; // one step further and it breaks
    }
    return best ?? first;
  }

  // "atleast" — the smallest move that reaches the target.
  if (holds(bFlat)) return toHex(blended(0));

  // Moving *toward* `toward` is the usual intent, but it is not always the
  // way: a bright brand colour on a dark page has to get darker to read,
  // and the only darker direction is away from the text colour. So both
  // directions are searched and the smaller move wins.
  //
  // The test runs on the *quantised* colour, not on the float: a blend that
  // measures 4.503 in floating point can come out as 4.496 once it is
  // rounded to an 8-bit hex, and that is the colour the browser paints.
  const search = (sign) => {
    for (let i = 1; i <= STEPS; i++) {
      const w = (sign * i) / STEPS;
      const hex = toHex(blended(w));
      if (holds(parseColor(hex))) return { w, hex };
    }
    return null;
  };
  const towardHit = search(1);
  const awayHit = search(-1);
  if (towardHit && awayHit) {
    return Math.abs(towardHit.w) <= Math.abs(awayHit.w) ? towardHit.hex : awayHit.hex;
  }
  if (towardHit) return towardHit.hex;
  if (awayHit) return awayHit.hex;

  // Nothing reaches the target. Report whichever end came closest, so the
  // matrix check prints the real number instead of a guess.
  const endToward = blended(1);
  const endAway = blended(-1);
  return worstAgainst(endToward) >= worstAgainst(endAway)
    ? toHex(endToward)
    : toHex(endAway);
}

/**
 * The faintest a role may get while still reading on its own surface.
 *
 * A placeholder and a disabled label are meant to be faint, but faint is not
 * invisible. The rule is two-sided, because one direction is not enough:
 *
 *   - the text already reads on the surface → fade it *toward* the surface,
 *     as far as the target allows (a placeholder that recedes);
 *   - the text does not read on the surface at all (pale text on a pale
 *     overlay) → fading cannot fix that, so move *away* from the surface
 *     until it does.
 *
 * Without the second branch a theme could ship a placeholder that is
 * invisible, which is the failure a contrast check is supposed to catch.
 *
 * @param {object} spec
 *   base     the colour to fade
 *   toward   the surface to fade toward
 *   away     the colour to fall back to when fading cannot work
 *   against  the surface the role must still read on — one, or every
 *            surface the role can land on
 *   target   the contrast ratio to reach
 */
export function fadeUntil(spec, backdrop) {
  const { base, toward, away, against, target } = spec;
  const b = parseColor(base);
  const references = (Array.isArray(against) ? against : [against]).map(parseColor);
  if (!b || references.some((x) => !x)) return null;

  const backdropOpaque = backdrop ?? { r: 255, g: 255, b: 255, a: 1 };
  const flat = (c) => (c.a >= 1 ? c : {
    r: c.r * c.a + backdropOpaque.r * (1 - c.a),
    g: c.g * c.a + backdropOpaque.g * (1 - c.a),
    b: c.b * c.a + backdropOpaque.b * (1 - c.a),
    a: 1,
  });
  const lum = (c) => luminance(c);
  const ratioBetween = (x, y) => {
    const l1 = lum(x);
    const l2 = lum(y);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  };
  const bFlat = flat(b);
  const aFlats = references.map(flat);
  const now = Math.min(...aFlats.map((a) => ratioBetween(bFlat, a)));

  if (now >= target) {
    return mixUntil({ base, toward, against, target, mode: "atmost" }, backdrop);
  }
  return mixUntil({ base, toward: away, against, target, mode: "atleast" }, backdrop);
}

/**
 * Composite a stack of colours bottom-up into one opaque colour.
 *
 * A translucent fill over a translucent container is a colour that neither
 * token describes on its own: the fill says "8% white" and the container
 * says "4% white", and the text sitting on both is sitting on something
 * neither of them names. The stack is given top-first, and the last entry
 * is composited over the backdrop.
 *
 * @param {string[]} stack  colour strings, top-most first
 * @param {object} backdrop  the opaque colour under the whole stack
 */
export function flattenStack(stack, backdrop) {
  // A fully transparent layer contributes nothing, so it is dropped rather
  // than treated as a failure: a mood may declare a transparent surface, and
  // the stack still has a real colour underneath it.
  const parsed = stack.map((s) => {
    if (String(s).trim() === "transparent") return { r: 0, g: 0, b: 0, a: 0 };
    return parseColor(s);
  });
  if (parsed.some((c) => !c)) return null;
  let acc = backdrop ?? { r: 255, g: 255, b: 255, a: 1 };
  for (let i = parsed.length - 1; i >= 0; i--) {
    acc = flatten(parsed[i], acc);
  }
  return toHex(acc);
}

/**
 * Weaken a shadow by reducing the alpha of its colour, leaving the geometry
 * alone. A shadow is not a colour, so "mixing" it toward the page would do
 * nothing useful.
 */
export function weakenShadow(shadowRaw, factor) {
  if (typeof shadowRaw !== "string") return null;
  return shadowRaw.replace(
    /rgba?\(([^)]+)\)/gi,
    (whole, inner) => {
      const parts = inner.split(",").map((p) => p.trim());
      if (parts.length < 4) return whole;
      const alpha = Number(parts[3]);
      if (!Number.isFinite(alpha)) return whole;
      return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${(alpha * factor).toFixed(3)})`;
    },
  );
}

/**
 * A foreground that is readable on `fillRaw`.
 *
 * Reuses the same rule the state foregrounds use, so an `info` chip is as
 * legible as an `ok` chip.
 */
export function foregroundOn(fillRaw, seedRaws, backdropRaw) {
  const backdrop = parseColor(backdropRaw) ?? { r: 255, g: 255, b: 255, a: 1 };
  const seeds = seedRaws.filter(Boolean);
  const got = readableForeground(fillRaw, seeds, backdrop);
  return got ? got.hex : null;
}

/** The contrast ratio between two colour strings, compositing over a backdrop. */
export { contrastRatio, parseColor };
