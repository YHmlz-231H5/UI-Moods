// UI Moods · component manifests.
//
// One manifest per component, and the manifest is the only hand-written
// description of that component. From it the build derives:
//
//   components/<id>/style.css   →  components/um-components.css
//   components/<id>/manifest.json  →  site/component/<id>.html
//                                   →  types/index.d.ts
//                                   →  components/index.json
//
// The manifest is deliberately framework-neutral. A CSS generator reads the
// class names; a component generator reads the variant and prop names. That
// is what lets the same file describe both the plain-HTML library and, later,
// a Vue 3 wrapper — the way Element Plus ships `theme-chalk` separately from
// its Vue components, and Arco ships `theme.css` separately from its React
// ones.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import Ajv from "ajv";

/** The categories, in the order Element Plus lists them. */
export const CATEGORIES = [
  { id: "basic", name: "Basic", nameZh: "基础" },
  { id: "form", name: "Form", nameZh: "表单" },
  { id: "data", name: "Data", nameZh: "数据展示" },
  { id: "navigation", name: "Navigation", nameZh: "导航" },
  { id: "feedback", name: "Feedback", nameZh: "反馈" },
  { id: "other", name: "Others", nameZh: "其他" },
];

const ajv = new Ajv({ strict: false, allErrors: true });

/**
 * The compiled schema.
 *
 * The schema carries an `$id`, and Ajv refuses to compile the same id twice
 * on one instance — so the validator is compiled once and reused. The check
 * is called more than once in a process (the component layer and the Vue
 * layer both load the manifests), and the second call used to throw.
 */
let validateManifest = null;

/** Load and schema-check every manifest under `components/`. */
export function loadManifests(root) {
  if (!validateManifest) {
    const schema = JSON.parse(
      readFileSync(join(root, "schemas", "component.schema.json"), "utf8").replace(/^\uFEFF/, ""),
    );
    validateManifest = ajv.compile(schema);
  }
  const validate = validateManifest;

  const dir = join(root, "components");
  const problems = [];
  const manifests = [];

  for (const id of readdirSync(dir, { withFileTypes: true })) {
    if (!id.isDirectory()) continue;
    const manifestPath = join(dir, id.name, "manifest.json");
    if (!existsSync(manifestPath)) continue;

    const manifest = JSON.parse(readFileSync(manifestPath, "utf8").replace(/^\uFEFF/, ""));
    if (manifest.id !== id.name) {
      problems.push(`components/${id.name}/manifest.json declares id "${manifest.id}"`);
    }
    if (!validate(manifest)) {
      for (const e of validate.errors ?? []) {
        problems.push(`components/${id.name}/manifest.json ${e.instancePath || "/"} ${e.message}`);
      }
      continue;
    }
    manifests.push(manifest);
  }

  // The catalogue order is the category order first, then the order the
  // manifests are read in — which is the alphabetical directory order, so
  // the list is stable without a separate index file.
  const order = new Map(CATEGORIES.map((c, i) => [c.id, i]));
  manifests.sort(
    (a, b) => (order.get(a.category) ?? 99) - (order.get(b.category) ?? 99) || a.id.localeCompare(b.id),
  );

  return { manifests, problems };
}

/** The modifier class a variant or size produces. */
export function modifierClass(manifest, id) {
  const prefix = manifest.class.modifier ?? `${manifest.class.base}--`;
  return `${prefix}${id}`;
}

/** The part class an inner element produces. */
export function partClass(manifest, id) {
  const prefix = manifest.class.part ?? `${manifest.class.base}__`;
  return `${prefix}${id}`;
}

/**
 * Every class name the manifest claims exists.
 *
 * The build checks each one against the stylesheet, so a manifest cannot
 * advertise a variant that was never painted.
 */
export function declaredClasses(manifest) {
  const out = new Set([manifest.class.base]);
  // A component that covers a family of native controls paints more than one
  // base class: `um-input` also paints `um-textarea` and `um-select`, and the
  // instance carries one of them.
  for (const c of manifest.class.also ?? []) out.add(c);
  for (const v of manifest.variants ?? []) {
    if (v.default) continue; // the default variant is the base class itself
    out.add(modifierClass(manifest, v.id));
  }
  for (const s of manifest.sizes ?? []) {
    if (s.default) continue; // likewise the default size
    out.add(modifierClass(manifest, s.id));
  }
  for (const p of manifest.parts ?? []) out.add(partClass(manifest, p.id));
  for (const s of manifest.states ?? []) {
    if (s.selector && s.selector.startsWith(".")) out.add(s.selector.slice(1));
  }
  return out;
}

/** The catalogue written to `components/index.json`. */
export function catalogue(manifests) {
  return {
    version: "1.1.0",
    categories: CATEGORIES,
    components: manifests.map((m) => ({
      id: m.id,
      name: m.name,
      nameZh: m.nameZh ?? "",
      category: m.category,
      element: m.element,
      summary: m.summary,
      since: m.since ?? "",
      file: `components/${m.id}/manifest.json`,
      style: `components/${m.id}/${m.style}`,
      doc: `site/component/${m.id}.html`,
      variants: (m.variants ?? []).length,
      sizes: (m.sizes ?? []).length,
      states: (m.states ?? []).length,
      parts: (m.parts ?? []).length,
      props: (m.props ?? []).length,
    })),
  };
}
