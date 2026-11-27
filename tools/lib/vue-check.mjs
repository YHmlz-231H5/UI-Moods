// ui-moods · Vue component checks
//
// The Vue package is a thin layer over the stylesheet: a wrapper renders the
// same markup the documentation shows and lets the CSS decide what it looks
// like. That is only true if the wrapper and the manifest agree, so the
// agreement is checked rather than assumed.
//
// What is checked, per component:
//
//   1. The wrapper exists and exports the component under its agreed name
//      (`um-button` → `UMButton`).
//   2. The wrapper's props are the manifest's props — same names, same
//      types, same defaults. A prop the manifest does not declare is a prop
//      the documentation will never mention.
//   3. Rendering the wrapper produces only class names that the component's
//      stylesheet actually declares. A wrapper that emits `um-button--ghost`
//      when no such variant exists would paint nothing, silently.
//   4. Rendering the wrapper produces every part the manifest declares, and
//      no part it does not. A part that is documented but never rendered is
//      a part nobody can use.
//
// Vue is a dev dependency. When it is not installed the check is skipped
// rather than failed — the library itself does not need it.

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { loadManifests, declaredClasses } from "./manifest.mjs";

/** `input-number` → `InputNumber` */
const pascal = (id) =>
  id
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");

/** The name a wrapper has to export. */
export const componentName = (id) => `UM${pascal(id)}`;

/**
 * Every class name in a piece of HTML.
 */
function classesIn(html) {
  const out = new Set();
  for (const m of html.matchAll(/class="([^"]*)"/g)) {
    for (const c of m[1].split(/\s+/)) if (c) out.add(c);
  }
  return out;
}

/** The class names a single class attribute holds. */
function classList(html) {
  const out = new Set();
  for (const m of html.matchAll(/class="([^"]*)"/g)) {
    for (const c of m[1].split(/\s+/)) if (c) out.add(c);
  }
  return out;
}

/** The manifest prop type → the Vue prop constructor. */
const VUE_TYPE = {
  boolean: "Boolean",
  number: "Number",
  string: "String",
  enum: "String",
  array: "Array",
};

/**
 * `controls-position` → `controlsPosition`.
 *
 * The manifest may spell a prop the way the HTML attribute is spelled; a Vue
 * prop is camelCased, so that is what the wrapper declares and what the check
 * compares.
 */
const propName = (name) =>
  /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name)
    ? name
    : name.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());

/**
 * @param {string} root the repository root
 * @param {{ only?: string[] }} [options] `only` narrows the check to the
 *   named components, so an author can check their own wrappers while the rest
 *   of the library is still in flight.
 * @returns {Promise<{ errors: string[], warnings: string[], skipped?: boolean }>}
 */
export async function checkVueComponents(root, options = {}) {
  const errors = [];
  const warnings = [];

  const wrapperDir = join(root, "vue", "components");
  if (!existsSync(wrapperDir)) {
    return { errors: [], warnings: [], skipped: true };
  }

  let vue;
  let serverRenderer;
  try {
    vue = await import("vue");
    serverRenderer = await import("@vue/server-renderer");
  } catch (e) {
    // Vue is not installed: the Vue layer cannot be checked, but the library
    // itself is fine.
    return { errors: [], warnings: [], skipped: true };
  }

  const { manifests } = loadManifests(root);
  const wrappers = new Set(
    readdirSync(wrapperDir)
      .filter((f) => f.endsWith(".js") && f !== "index.js")
      .map((f) => f.replace(/\.js$/, "")),
  );

  const only = options.only?.length ? new Set(options.only) : null;

  for (const m of manifests) {
    if (only && !only.has(m.id)) continue;
    const file = join(wrapperDir, `${m.id}.js`);
    if (!wrappers.has(m.id)) {
      errors.push(`vue: no wrapper for "${m.id}" — write vue/components/${m.id}.js`);
      continue;
    }

    let mod;
    try {
      mod = await import(`file://${file.replace(/\\/g, "/")}`);
    } catch (e) {
      errors.push(`vue: vue/components/${m.id}.js does not load — ${e.message}`);
      continue;
    }

    const expected = componentName(m.id);
    const component = mod[expected];
    if (!component) {
      errors.push(
        `vue: vue/components/${m.id}.js does not export ${expected} ` +
          `(it exports ${Object.keys(mod).filter((k) => k !== "default").join(", ") || "nothing"})`,
      );
      continue;
    }

    // --- the props agree with the manifest ---------------------------------
    const declared = new Map((m.props ?? []).map((p) => [propName(p.name), p]));
    const actual = new Map(Object.entries(component.props ?? {}));

    for (const [name, p] of declared) {
      if (!actual.has(name)) {
        errors.push(`vue: ${expected} has no "${name}" prop, but the manifest declares it`);
        continue;
      }
      const a = actual.get(name);
      const want = VUE_TYPE[p.type] ?? "String";
      const got = Array.isArray(a.type) ? a.type.map((t) => t.name).join("|") : a.type?.name;
      if (got !== want) {
        errors.push(`vue: ${expected} prop "${name}" is typed ${got}, the manifest says ${want}`);
      }
      if (p.default !== undefined && a.default !== undefined) {
        const wantDefault = p.type === "boolean" ? p.default === "true" : p.default;
        if (String(a.default) !== String(wantDefault)) {
          errors.push(
            `vue: ${expected} prop "${name}" defaults to ${JSON.stringify(a.default)}, ` +
              `the manifest says ${JSON.stringify(wantDefault)}`,
          );
        }
      }
    }
    for (const name of actual.keys()) {
      if (!declared.has(name)) {
        errors.push(`vue: ${expected} has a "${name}" prop the manifest does not declare`);
      }
    }

    // --- the example it reproduces exists -----------------------------------
    if (component.example && !(m.examples ?? []).some((e) => e.id === component.example)) {
      errors.push(
        `vue: ${expected} points at example "${component.example}", which the manifest does not have`,
      );
    }

    // --- rendering ----------------------------------------------------------
    let html = "";
    try {
      const app = vue.createSSRApp({
        render() {
          return vue.h(component, { ...componentProps(m) });
        },
      });
      html = await serverRenderer.renderToString(app);
    } catch (e) {
      errors.push(`vue: ${expected} does not render — ${e.message}`);
      continue;
    }

    const painted = classList(html);
    const allowed = declaredClasses(m);

    // every class the wrapper paints has to exist in the stylesheet
    for (const c of painted) {
      if (!allowed.has(c)) {
        errors.push(`vue: ${expected} paints "${c}", which the stylesheet does not declare`);
      }
    }

    // every part the manifest declares has to be painted
    const partPrefix = m.class.part ?? `${m.class.base}__`;
    for (const p of m.parts ?? []) {
      const cls = `${partPrefix}${p.id}`;
      if (!painted.has(cls)) {
        errors.push(`vue: ${expected} never renders the "${p.id}" part (${cls})`);
      }
    }
    // ...and no part it does not declare
    //
    // Two kinds of class look like a part and are not one. A state selector
    // can start with the part prefix — `um-steps__item--active` — and so can
    // a variant modifier, when a component puts its variants on one of its
    // own parts — `um-timeline__item--success`. Both are declared, so both
    // are excluded before the parts are compared.
    const notParts = new Set(
      [
        ...(m.states ?? [])
          .map((s) => s.selector)
          .filter((s) => s && s.startsWith("."))
          .map((s) => s.slice(1)),
        ...(m.variants ?? [])
          .filter((v) => !v.default)
          .map((v) => `${m.class.modifier ?? `${m.class.base}--`}${v.id}`),
        ...(m.sizes ?? [])
          .filter((s) => !s.default)
          .map((s) => `${m.class.modifier ?? `${m.class.base}--`}${s.id}`),
      ],
    );
    for (const c of painted) {
      if (!c.startsWith(partPrefix)) continue;
      if (notParts.has(c)) continue;
      const id = c.slice(partPrefix.length);
      if (!(m.parts ?? []).some((p) => p.id === id)) {
        errors.push(`vue: ${expected} renders "${c}", which the manifest does not declare`);
      }
    }
  }

  return { errors, warnings };
}

/**
 * The props a component is rendered with by default.
 *
 * Every boolean prop is switched on, so that the state modifiers — a
 * loading button, a disabled field — are painted and can be checked against
 * the stylesheet too.
 */
function componentProps(m) {
  const props = {};
  for (const p of m.props ?? []) {
    const name = propName(p.name);
    if (p.type === "boolean") props[name] = true;
    else if (p.type === "number") {
      // A number with no default is left out rather than set to zero: a
      // `model-value` that was not declared has to stay `undefined`, because
      // that is how a wrapper tells "the caller did not bind it" from "the
      // caller bound a zero".
      if (p.default !== undefined) props[name] = Number(p.default);
    } else if (p.type === "array") {
      // An array prop has no single default to render with.
    } else if (p.default !== undefined) {
      props[name] = p.default;
    }
  }
  return props;
}
