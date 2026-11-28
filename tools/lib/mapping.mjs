// Shared tokens → CSS custom property mapping.
// Single source of truth for build-specimen and validate.
// Convention documented in docs/css-var-mapping.md §1–§3.

import { flatten, mixUntil, toHex } from "./ramp.mjs";
import { parseColor } from "./state-colors.mjs";

export const MAPPED_GROUPS = [
  "colors",
  "typography",
  "radii",
  "borders",
  "effects",
  "shadows",
  "spacing",
  "motion",
];

// Fields inside mapped groups that are NOT injected into CSS.
export const SKIP_FIELDS = new Set(["weights", "panelOpacity"]);

// Optional-token fallback allowlist (docs/css-var-mapping.md §8).
// Only these vars may use a CSS fallback to skip declaration; validate errors
// on any other fallback usage (it could mask a missing required token).
export const FALLBACK_ALLOWED = new Set([
  "--mood-effects-glow",
  "--mood-effects-backdrop-filter",
  "--mood-colors-on-accent",
]);

export function kebabCase(value) {
  return value.replace(/[A-Z]/g, (ch) => "-" + ch.toLowerCase());
}

const REF_RE = /^\{([a-zA-Z][a-zA-Z0-9_]*)\.([a-zA-Z][a-zA-Z0-9_]*)\}$/;

/**
 * The semantic component layer nests freely, so it is flattened into one
 * variable per leaf:
 *
 *   components.badge.ok.bg → --mood-components-badge-ok-bg
 *
 * A leaf that points at another token keeps the reference, so the value stays
 * owned by the token it points at — `--mood-components-badge-ok-bg:
 * var(--mood-colors-ok)` — and a mood can retune it in one place.
 */
export function componentVars(tokens) {
  const out = [];
  const walk = (node, path) => {
    if (node === null || typeof node !== "object") {
      if (typeof node === "number") {
        out.push([path, String(node)]);
        return;
      }
      if (typeof node !== "string") return;
      const ref = REF_RE.exec(node);
      if (ref) {
        if (tokens[ref[1]]?.[ref[2]] === undefined) return;
        out.push([path, `var(--mood-${ref[1]}-${kebabCase(ref[2])})`]);
      } else {
        out.push([path, node]);
      }
      return;
    }
    for (const [key, value] of Object.entries(node)) {
      walk(value, path ? `${path}-${kebabCase(key)}` : kebabCase(key));
    }
  };
  walk(tokens.components ?? {}, "components");
  return out;
}

/**
 * The surfaces the mood templates actually paint text on.
 *
 * The templates stack translucent fills: a card paints `surface` over the
 * page, and a control inside the card paints `surface` again. The colour the
 * reader sees is the *composite*, and no token names it — so a derived text
 * colour measured against the raw tokens can read on the page and still
 * vanish inside a card. In the four moods whose surfaces are translucent,
 * that is the difference between 4.39:1 and 3.66:1 on a column heading.
 *
 * Two layers is the depth the templates are allowed to reach, and the depth
 * the derived colours are measured against. A third layer would be a third
 * step of frosting, and one colour cannot serve it: the page and the third
 * layer are far enough apart in lightness that a colour clearing 4.5:1 on
 * both is white, and a caption that is brighter than the body text is not a
 * caption. The section container therefore paints a *flattened* surface — the
 * same colour the reader sees, in one layer — and the stack stops there.
 *
 * Each entry is one stack, flattened to a single opaque colour over the page.
 * For a mood whose surfaces are opaque the stacks collapse to two colours, so
 * the derivation does not move at all.
 *
 * @param {object} colors a mood's colours
 * @param {object} backdrop the page colour, parsed
 * @returns {string[]} the surfaces, as opaque hex colours
 */
function effectiveSurfaces(colors, backdrop) {
  const panel = colors.panel ? parseColor(colors.panel) : null;
  const surface = colors.surface ? parseColor(colors.surface) : null;
  const layers = [panel, surface].filter(Boolean);

  const out = [toHex(backdrop)];

  /** Composite a stack, top-most first, over the page. */
  const add = (stack) => {
    let acc = backdrop;
    for (let i = stack.length - 1; i >= 0; i--) acc = flatten(stack[i], acc);
    out.push(toHex(acc));
  };

  // Every combination of one and two layers.
  for (const a of layers) {
    add([a]);
    for (const b of layers) add([a, b]);
  }
  return [...new Set(out)];
}
/**
 * The colours the mood layer derives rather than declares.
 *
 * A mood owns a muted colour chosen for looks, and in twenty of the
 * thirty-two moods that colour is below 4.5:1 as text — it is a tint, not a
 * reading colour. The component layer already solves this in its own role
 * (`text-secondary`): it moves the muted colour toward the text colour just
 * far enough to read, and it leaves the mood alone. The app packs and the
 * specimens draw the mood's own tokens, so they need the same move under the
 * same rule.
 *
 * The name says what it is: `--mood-colors-text-secondary` is the muted
 * colour *as text*, not the muted colour.
 *
 * The same rule applies to the state colours used as text: a brand colour is
 * a fill — the accent of the brutal mood is a bright yellow, readable as a
 * badge and unreadable as a price — so the accent, ok, warn and danger
 * colours each get a companion derived for use as text.
 *
 * @param {object} tokens a mood's tokens
 * @returns {Array} the derived variables, as [name, value] pairs
 */
export function derivedVars(tokens) {
  const colors = tokens.colors ?? {};
  const bg = colors.bg;
  const muted = colors.muted;
  const text = colors.textStrong ?? colors.text;
  if (!bg || !muted || !text) return [];

  const backdrop = parseColor(bg);
  if (!backdrop) return [];

  // Every surface a derived text colour can land on. The margin is headroom
  // above the bar, the same one the component layer's `text-secondary` role
  // carries: a colour derived to sit exactly on 4.5:1 lands a hundredth under
  // it once the browser has composited a translucent fill with its own
  // rounding.
  const against = effectiveSurfaces(colors, backdrop);

  const value = mixUntil(
    { base: muted, toward: text, against, target: 4.55, mode: "atleast" },
    backdrop,
  );
  if (!value) return [];

  const out = [["--mood-colors-text-secondary", value]];

  for (const name of ["accent", "ok", "warn", "danger"]) {
    const base = colors[name];
    if (!base) continue;
    const textValue = mixUntil(
      { base, toward: text, against, target: 4.55, mode: "atleast" },
      backdrop,
    );
    if (textValue) out.push([`--mood-colors-${name}-text`, textValue]);
  }

  // The flattened surface. A translucent fill over the page is a colour the
  // reader sees but no token names, and a second translucent fill over that
  // is another one — so the stack under a card is three layers deep in the
  // frosted moods. A container that paints the *flattened* colour shows the
  // reader exactly the same pixels and stops the stack at one layer.
  //
  // This is the component layer's `surface-panel` role, brought to the mood
  // layer: the library paints the flattened colour for the same reason.
  const surface = colors.surface ? parseColor(colors.surface) : null;
  if (surface) {
    out.push(["--mood-colors-surface-flat", toHex(flatten(surface, backdrop))]);
  }

  return out;
}

/** Every `--mood-*` variable a mood is expected to declare. */
export function expectedVars(tokens) {
  const set = new Set();
  for (const group of MAPPED_GROUPS) {
    const obj = tokens[group];
    if (!obj || typeof obj !== "object") continue;
    for (const [key, value] of Object.entries(obj)) {
      if (SKIP_FIELDS.has(key)) continue;
      if (typeof value !== "string" && typeof value !== "number") continue;
      set.add(`--mood-${group}-${kebabCase(key)}`);
    }
  }
  for (const [name] of componentVars(tokens)) set.add(`--mood-${name}`);
  for (const [name] of derivedVars(tokens)) set.add(name);
  return set;
}

/**
 * The `:root` block of a mood artifact: one custom property per token.
 *
 * Shared by build-specimen and build-apps so the two can never drift.
 */
export function buildCssVars(tokens) {
  const lines = [];
  for (const group of MAPPED_GROUPS) {
    const obj = tokens[group];
    if (!obj || typeof obj !== "object") continue;
    for (const [key, value] of Object.entries(obj)) {
      if (SKIP_FIELDS.has(key)) continue;
      if (typeof value !== "string" && typeof value !== "number") continue;
      lines.push(`      --mood-${group}-${kebabCase(key)}: ${value};`);
    }
  }
  for (const [name, value] of componentVars(tokens)) {
    lines.push(`      --mood-${name}: ${value};`);
  }
  for (const [name, value] of derivedVars(tokens)) {
    lines.push(`      ${name}: ${value};`);
  }
  return lines.join("\n");
}
