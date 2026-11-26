// Shared tokens → CSS custom property mapping.
// Single source of truth for build-specimen and validate.
// Convention documented in docs/css-var-mapping.md §1–§3.

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
  return lines.join("\n");
}
