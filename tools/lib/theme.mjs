// UI Moods · theme adapter.
//
// Turns a mood's `tokens.json` into the component library's role variables.
// This is the only place where a mood is allowed to speak to the component
// layer — the component CSS reads `--um-*` and never `--mood-*`.
//
// The contract lives in `tokens/roles.json`. Every role must resolve, or the
// theme is incomplete and `validate` fails: a component that reads a variable
// nobody defines renders wrong on that theme and nowhere else.

import { readFileSync } from "node:fs";
import { mix, weakenShadow, foregroundOn, mixUntil, fadeUntil, flattenStack, parseColor, toHex } from "./ramp.mjs";

/** Read the role contract. */
export function loadContract(path) {
  return JSON.parse(readFileSync(path, "utf8").replace(/^\uFEFF/, ""));
}

/** Read a dotted path out of a nested object. */
function dig(obj, path) {
  return path.split(".").reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
}

/**
 * A reference to a mood's own token, written `{colors.muted}`.
 *
 * The role vocabulary is for the *library*; a derivation sometimes needs to
 * start from the mood's raw colour rather than from a derived role — the
 * muted grey is the one case where the library wants the mood's own value
 * and then decides how far to move it.
 */
const MOOD_REF = /^\{([\w.]+)\}$/;

/**
 * Resolve every role of the contract for one mood.
 *
 * @returns {{ values: Map<string,string>, missing: string[] }}
 */
export function resolveTheme(tokens, contract) {
  const roles = contract.roles ?? {};
  const values = new Map();
  const missing = [];
  const resolving = new Set();

  // The backdrop every translucent colour is composited over.
  const backdropOf = () => {
    const raw = values.get("bg-page");
    const c = parseColor(raw ?? "#ffffff");
    if (!c) return { r: 255, g: 255, b: 255, a: 1 };
    return c.a >= 1 ? c : { r: 255, g: 255, b: 255, a: 1 };
  };

  const colorOf = (role) => {
    const raw = values.get(role);
    const c = parseColor(raw ?? "");
    if (!c) return null;
    const backdrop = backdropOf();
    return c.a >= 1 ? c : {
      r: c.r * c.a + backdrop.r * (1 - c.a),
      g: c.g * c.a + backdrop.g * (1 - c.a),
      b: c.b * c.a + backdrop.b * (1 - c.a),
      a: 1,
    };
  };

  /**
   * A surface a role can be measured against.
   *
   * A transparent surface has nothing to measure against: it shows the page
   * through it, so the page is what the text actually sits on.
   */
  const surfaceOf = (name) => {
    const raw = valueOf(name);
    if (raw === undefined || raw === null) return undefined;
    return String(raw).trim() === "transparent" ? valueOf("bg-page") : raw;
  };

  const valueOf = (name) => {
    if (values.has(name)) return values.get(name);
    const ref = MOOD_REF.exec(name);
    if (ref) {
      const raw = dig(tokens, ref[1]);
      return raw === undefined || raw === null ? undefined : String(raw);
    }
    const spec = roles[name];
    if (!spec) return undefined;
    if (resolving.has(name)) {
      missing.push(name);
      return undefined;
    }
    resolving.add(name);

    let out;
    if (spec.from !== undefined) {
      const raw = dig(tokens, spec.from);
      if (raw === undefined || raw === null) {
        // An optional role a mood does not declare simply does not exist.
        if (!(contract.optional ?? []).includes(name)) missing.push(name);
        out = undefined;
      } else {
        out = String(raw);
      }
    } else if (spec.derive) {
      const base = valueOf(spec.derive.base);
      const target = valueOf(spec.derive.mix);
      const backdrop = backdropOf();
      const hex = mix(base, target, spec.derive.weight, backdrop);
      out = hex ?? undefined;
    } else if (spec.op === "weaken") {
      const base = valueOf(spec.base);
      out = base ? weakenShadow(base, spec.factor) : undefined;
    } else if (spec.op === "flatten") {
      // The effective colour of a stack of translucent layers. Nothing in the
      // mood names it, so it is computed here once and used everywhere a
      // control's real surface matters.
      const stack = (spec.stack ?? []).map((s) => valueOf(s));
      const backdrop = backdropOf();
      out =
        stack.length && stack.every((s) => s !== undefined)
          ? flattenStack(stack, backdrop)
          : undefined;
    } else if (spec.op === "contrast") {
      const base = valueOf(spec.base);
      const toward = surfaceOf(spec.toward);
      // `against` may name several surfaces: a brand colour used as text has
      // to read on the page *and* on a floating overlay, and the two are not
      // the same lightness.
      const wanted = Array.isArray(spec.against) ? spec.against : [spec.against];
      const against = wanted.map(surfaceOf);
      const backdrop = backdropOf();
      out =
        base && toward && against.every((a) => a !== undefined)
          ? mixUntil(
              {
                base,
                toward,
                against: against.length === 1 ? against[0] : against,
                target: spec.target,
                mode: spec.mode ?? "atleast",
              },
              backdrop,
            )
          : undefined;
    } else if (spec.op === "fade") {
      const base = valueOf(spec.base);
      const toward = surfaceOf(spec.toward);
      const away = surfaceOf(spec.away);
      // A faded role has to hold on every surface it can land on: a disabled
      // button sits on the control fill, a disabled label sits on the page.
      const wanted = Array.isArray(spec.against) ? spec.against : [spec.against];
      const against = wanted.map(surfaceOf);
      const backdrop = backdropOf();
      out =
        base && toward && away && against.every((a) => a !== undefined)
          ? fadeUntil(
              {
                base,
                toward,
                away,
                against: against.length === 1 ? against[0] : against,
                target: spec.target,
              },
              backdrop,
            )
          : undefined;
    } else if (spec.op === "on") {
      const base = valueOf(spec.base);
      const backdrop = backdropOf();
      const seeds = ["text-primary", "text-regular"]
        .map((r) => colorOf(r))
        .filter(Boolean)
        .map((c) => toHex(c));
      out = base ? foregroundOn(base, seeds, toHex(backdrop)) : undefined;
    }

    resolving.delete(name);
    if (out !== undefined) values.set(name, out);
    return out;
  };

  // Direct roles first: the derived ones anchor on the page background.
  for (const [name, spec] of Object.entries(roles)) {
    if (spec.from !== undefined) valueOf(name);
  }
  for (const name of Object.keys(roles)) valueOf(name);

  return { values, missing: [...new Set(missing)] };
}

/**
 * The `:root` block of a theme.
 *
 * Both selectors are emitted from one set of declarations: `:root` so the
 * file works on its own (`<link>` it and the whole library is that mood), and
 * `[data-um-theme="<id>"]` so several themes can coexist on one page and be
 * switched by an attribute.
 */
export function themeCss(id, values, contract, meta) {
  const prefix = contract.prefix ?? "--um";
  const lines = [];
  for (const [name, value] of values) {
    lines.push(`  ${prefix}-${name}: ${value};`);
  }
  const title = meta?.name ? `${meta.name} (${meta.nameZh ?? ""})` : id;
  return [
    `/* ui-moods theme · ${id} · ${title}`,
    ` * Generated by tools/build-themes.mjs from moods/${id}/tokens.json — do not edit.`,
    ` * Usage: <link rel="stylesheet" href="components/um-components.css">`,
    ` *        <link rel="stylesheet" href="themes/${id}.css">`,
    ` */`,
    `:root,`,
    `[data-um-theme="${id}"] {`,
    ...lines,
    `}`,
    ``,
  ].join("\n");
}
