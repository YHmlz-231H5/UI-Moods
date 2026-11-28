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
      // A margin is headroom above the bar. The browser paints a translucent
      // stack with fractional channels and measures the composite that way,
      // while the theme measures a rounded one — so a colour derived to sit
      // exactly on the line can land a hundredth under it in the browser. A
      // margin keeps the derived colour clear of the line on both sides.
      const target = spec.target + (spec.margin ?? 0);
      out =
        base && toward && against.every((a) => a !== undefined)
          ? mixUntil(
              {
                base,
                toward,
                against: against.length === 1 ? against[0] : against,
                target,
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
 * The declarations of a theme: the resolved roles, plus the absent value of
 * every optional role the mood does not declare.
 *
 * An optional role that is simply missing from the list is a role that
 * inherits from whichever theme file was linked after it. A mood with no glow
 * would end up wearing another mood's glow, and the symptom appears only in
 * the combined sheet, never in the single-file case — which is exactly the
 * kind of bug a screenshot of one theme cannot catch.
 */
function themeDeclarations(values, contract) {
  const prefix = contract.prefix ?? "--um";
  const lines = [];
  for (const [name, value] of values) {
    lines.push(`  ${prefix}-${name}: ${value};`);
  }
  const absent = contract.optionalAbsent ?? {};
  for (const name of contract.optional ?? []) {
    if (values.has(name)) continue;
    const fallback = absent[name];
    if (fallback === undefined) continue;
    lines.push(`  ${prefix}-${name}: ${fallback};`);
  }
  return lines;
}

/**
 * The `:root` block of a theme.
 *
 * The selector list is doing real work here.
 *
 * `:root` alone would be enough for a page that links exactly one theme file,
 * but it is also why the old version could not host several themes at once:
 * every theme file claimed `:root` at the same specificity, so the last file
 * linked won and an attribute could not override it.
 *
 * `:root[data-um-theme="<id>"]` is one step more specific than `:root`. So
 * when several theme files sit on one page, the file whose id matches the
 * attribute wins the cascade outright, whatever order the files were linked
 * in — and the `:root` part of the other files, which is only one step less
 * specific, cannot take it back.
 *
 * The bare `[data-um-theme="<id>"]` selector themes a subtree, not just the
 * document: an element that claims a mood gets that mood's variables, and
 * its own declarations beat the ones it would otherwise inherit.
 *
 * The practical result: link `themes/all.css` once, then set the attribute.
 * Switching a mood costs no network request, which is the difference between
 * a theme switcher that feels instant and one that flickers.
 */
export function themeCss(id, values, contract, meta) {
  const title = meta?.name ? `${meta.name} (${meta.nameZh ?? ""})` : id;
  return [
    `/* ui-moods theme · ${id} · ${title}`,
    ` * Generated by tools/build-themes.mjs from moods/${id}/tokens.json — do not edit.`,
    ` *`,
    ` * One theme:`,
    ` *   <link rel="stylesheet" href="components/um-components.css">`,
    ` *   <link rel="stylesheet" href="themes/${id}.css">`,
    ` *`,
    ` * Every theme, switched by attribute — no request per switch:`,
    ` *   <link rel="stylesheet" href="themes/all.css">`,
    ` *   document.documentElement.setAttribute('data-um-theme', 'night')`,
    ` */`,
    `:root,`,
    `:root[data-um-theme="${id}"],`,
    `[data-um-theme="${id}"] {`,
    ...themeDeclarations(values, contract),
    `}`,
    ``,
  ].join("\n");
}

/**
 * The scope of a theme, without the `:root` fallback.
 *
 * This is what the combined sheet uses for every mood except the default:
 * the trailing `:root` block answers for every case the scopes do not — no
 * mood named, or a mood named that does not exist — so a typo in a mood id
 * lands on the default mood rather than on whichever mood happened to be
 * linked last.
 */
export function themeScopeCss(id, values, contract, meta) {
  const title = meta?.name ? `${meta.name} (${meta.nameZh ?? ""})` : id;
  return [
    `/* ui-moods theme · ${id} · ${title}`,
    ` *`,
    ` * The mood's own scope. One step more specific than the \`:root\` fallback`,
    ` * at the end of this sheet, so it wins whenever the document names it.`,
    ` */`,
    `:root[data-um-theme="${id}"],`,
    `[data-um-theme="${id}"] {`,
    ...themeDeclarations(values, contract),
    `}`,
    ``,
  ].join("\n");
}

/**
 * The `:root` fallback of the default theme.
 *
 * It answers for every case no scope rule covers: a document that names no
 * mood, and a document that names a mood which does not exist.
 */
export function themeDefaultCss(id, values, contract, meta) {
  const title = meta?.name ? `${meta.name} (${meta.nameZh ?? ""})` : id;
  return [
    `/* ui-moods · the default mood · ${id} · ${title}`,
    ` *`,
    ` * Claimed whenever the document names no mood, or names one that does not`,
    ` * exist. Every scope rule above is one step more specific, so a mood that`,
    ` * does exist always wins over this.`,
    ` */`,
    `:root {`,
    ...themeDeclarations(values, contract),
    `}`,
    ``,
  ].join("\n");
}
