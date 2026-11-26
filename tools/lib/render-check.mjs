// UI Moods · rendered state layer check.
//
// `validate` proves the *tokens* are right. This module proves the *artifact*
// is right: it parses the generated CSS the way a browser does — merged
// selectors, shorthand vs longhand, later rule wins — and checks that every
// state is painted by its own variables.
//
// The two checks catch different failures. A template that binds `.badge.warn`
// to the accent variables leaves every token perfectly valid and every
// contrast assertion passing; only this check notices that the page paints
// the wrong state.

import { contrastRatio, parseColor } from "./state-colors.mjs";

/** The states a mood's semantic layer declares. */
export const STATES = ["neutral", "accent", "ok", "warn", "danger"];

/** The contract every state pair must clear. */
export const MIN_RATIO = 4.5;

/** The `:root` custom property map of a built artifact. */
export function cssVarsOf(html) {
  const block = html.match(/<style id="mood-tokens">([\s\S]*?)<\/style>/);
  if (!block) return null;
  const map = new Map();
  for (const line of block[1].split("\n")) {
    const m = line.match(/^\s*(--mood-[a-z0-9-]+)\s*:\s*(.+?);/);
    if (m) map.set(m[1], m[2].trim());
  }
  return map;
}

/** Resolve a custom property through its `var()` chain. */
export function resolveVar(map, name, seen = new Set()) {
  if (seen.has(name)) return null;
  seen.add(name);
  const raw = map.get(name);
  if (raw === undefined) return null;
  const ref = raw.match(/^var\((--mood-[a-z0-9-]+)\)$/);
  if (ref) return resolveVar(map, ref[1], seen);
  return raw;
}

/**
 * Every rule in a document, keyed by selector, declarations merged in order.
 *
 * A merged selector list (`.badge.accent, .badge.live { … }`) registers the
 * same body under each of its selectors, and a repeated selector keeps the
 * later declaration of a property — which is what the cascade does.
 */
export function parseRules(html) {
  const rules = new Map();
  for (const block of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) {
    const css = block[1].replace(/\/\*[\s\S]*?\*\//g, "");
    for (const m of css.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
      const decls = new Map();
      for (const d of m[2].split(";")) {
        const i = d.indexOf(":");
        if (i < 0) continue;
        decls.set(d.slice(0, i).trim(), d.slice(i + 1).trim());
      }
      for (const sel of m[1].split(",").map((s) => s.trim()).filter(Boolean)) {
        if (!rules.has(sel)) rules.set(sel, new Map());
        const target = rules.get(sel);
        for (const [k, v] of decls) target.set(k, v);
      }
    }
  }
  return rules;
}

/** The declarations a browser ends up with for a chain of selectors. */
export function effective(rules, selectors) {
  const out = new Map();
  for (const sel of selectors) {
    const d = rules.get(sel);
    if (d) for (const [k, v] of d) out.set(k, v);
  }
  return out;
}

const varRefs = (value) =>
  value ? [...value.matchAll(/var\((--mood-[a-z0-9-]+)\)/g)].map((m) => m[1]) : [];

/** The paint a declaration set produces: fill, foreground and border colour. */
export function paintOf(decls) {
  const bg = decls.get("background-color") ?? decls.get("background") ?? "";
  const fg = decls.get("color") ?? "";
  const bc = decls.get("border-color");
  const border = bc ?? decls.get("border") ?? "";
  // In the `border: width style colour` shorthand the colour comes last.
  return {
    bg: varRefs(bg),
    fg: varRefs(fg),
    border: bc ? varRefs(bc) : varRefs(border).slice(-1),
  };
}

function expectPaint(problems, label, what, refs, wanted) {
  if (!refs.includes(wanted)) {
    problems.push(
      `${label}: ${what} must be painted by ${wanted}, got ${refs.join(" / ") || "(nothing)"}`,
    );
  }
}

/**
 * Check that every state of a component is painted by its own variables, and
 * that the pair it paints is readable.
 *
 * @param {string} html   the built artifact
 * @param {string} label  how to name the artifact in a problem message
 * @param {Array}  specs  the components this artifact ships, each:
 *   `{ layer, base, mark? }` where `base` is the neutral selector (the
 *   neutral state is painted by the base rule), `layer` names the component
 *   in `--mood-components-<layer>-*`, and `mark` is the status chip inside it
 *   (`{ base, state }`, where `state` maps a state name to its selector).
 * @returns {string[]} problems, empty when the artifact is consistent
 */
export function checkRenderedStates(html, label, specs) {
  const problems = [];
  const map = cssVarsOf(html);
  if (!map) return [`${label}: missing the mood-tokens block`];

  const rules = parseRules(html);
  const backdropRaw = resolveVar(map, "--mood-colors-bg");
  const backdrop = parseColor(backdropRaw) ?? { r: 255, g: 255, b: 255, a: 1 };

  for (const spec of specs) {
    const { layer, base, mark } = spec;
    // An artifact that ships no such component at all (the gallery cover of
    // an app pack) is not a defect.
    if (!rules.has(base)) continue;

    for (const state of STATES) {
      const stateSel = state === "neutral" ? base : `${base}.${state}`;
      const paint = paintOf(effective(rules, [base, stateSel]));
      const fgName = `--mood-components-${layer}-${state}-fg`;
      const bgName = `--mood-components-${layer}-${state}-bg`;
      const bdName = `--mood-components-${layer}-${state}-border`;

      expectPaint(problems, label, `${stateSel} background`, paint.bg, bgName);
      expectPaint(problems, label, `${stateSel} color`, paint.fg, fgName);
      if (layer === "badge") {
        expectPaint(problems, label, `${stateSel} border`, paint.border, bdName);
      }

      // The pair the page actually shows must be readable.
      const fgRaw = resolveVar(map, fgName);
      const bgRaw = resolveVar(map, bgName);
      if (!fgRaw || !bgRaw) {
        problems.push(`${label}: ${fgName} / ${bgName} does not resolve`);
        continue;
      }
      const ratio = contrastRatio(fgRaw, bgRaw, backdrop);
      if (ratio !== null && ratio < MIN_RATIO) {
        problems.push(
          `${label}: ${layer}.${state} renders at ${ratio.toFixed(2)} < ${MIN_RATIO} ` +
            `(${fgRaw} on ${bgRaw})`,
        );
      }

      // The status chip inside the component follows the badge layer.
      if (mark) {
        const markSel = state === "neutral" ? mark.base : mark.state(state);
        const markPaint = paintOf(effective(rules, [mark.base, markSel]));
        expectPaint(
          problems,
          label,
          `${markSel} background`,
          markPaint.bg,
          `--mood-components-badge-${state}-bg`,
        );
        expectPaint(
          problems,
          label,
          `${markSel} color`,
          markPaint.fg,
          `--mood-components-badge-${state}-fg`,
        );
      }
    }
  }
  return problems;
}
