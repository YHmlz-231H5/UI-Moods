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
  return set;
}
