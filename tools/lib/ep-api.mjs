// Element Plus's own public API, read out of the published package.
//
// Two sources, and both of them are Element Plus's own:
//
// - `web-types.json` — the metadata Element Plus's documentation build
//   generates for editors. It lists, per component, the props and the slots.
//   It is the closest thing to a published API reference that exists, and it
//   keeps the two apart: `el-checkbox` and `el-checkbox-group` are two
//   components with two prop lists, not one.
// - `es/components/<name>/src/*.d.ts` — the TypeScript declarations the
//   package ships. They carry `interface XxxProps` and `declare const
//   xxxEmits`, so the props and the events can be read as declarations rather
//   than as prose.
//
// `web-types.json` does not cover every component: the service components —
// message, message box, notification, loading — the infinite-scroll
// directive and the tree select are not in it. For those the type
// declarations are the source, and the report says which source each
// component's numbers came from.

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/** `loadingIcon` and `loading-icon` are the same prop; the report uses one spelling. */
export function kebab(name) {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
}

/**
 * The body of a brace-balanced block that starts at `open`.
 *
 * The opening brace is included in the count, so the body is everything up to
 * the brace that closes it.
 */
function blockAt(text, open) {
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    const ch = text[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return text.slice(open + 1, i);
    }
  }
  return "";
}

/**
 * The depth-one keys of an object type.
 *
 * Only the keys at the top level of the body are returned: a nested option
 * object is part of one prop's type, not a prop of its own.
 */
function keysOf(body) {
  const out = [];
  let depth = 0;
  let line = "";
  const flush = () => {
    const m = /^\s*([A-Za-z_$][\w$]*)\s*\??\s*:/.exec(line);
    if (m && depth === 0) out.push(m[1]);
    line = "";
  };
  for (const ch of body) {
    if (ch === "{") depth++;
    else if (ch === "}") depth--;
    if (ch === "\n") flush();
    else line += ch;
  }
  flush();
  return out;
}

/**
 * The props of every `interface XxxProps` in a declaration file.
 *
 * The description is taken from the `@description` tag that Element Plus
 * writes above each property, because that is the text Element Plus's own
 * documentation shows.
 *
 * Three shapes are read: an `interface`, a `type` alias of an object literal,
 * and an `interface` of options — Element Plus writes the message box's
 * options as `ElMessageBoxOptions` and the loading directive's as
 * `LoadingOptionsResolved`, neither of which is named "Props".
 */
function propsOfDeclaration(text) {
  const props = new Map();
  const pattern = /(?:interface\s+(\w+)|type\s+(\w+)\s*=)\s*\{/g;
  for (const m of text.matchAll(pattern)) {
    const name = m[1] ?? m[2];
    if (!/(?:Props|Options|OptionsResolved)$/.test(name)) continue;
    const body = blockAt(text, text.indexOf("{", m.index));
    // Each property is preceded by a comment block that carries the
    // description, so the body is walked a line at a time.
    let description = "";
    for (const line of body.split("\n")) {
      const desc = /@description\s+(.*)$/.exec(line);
      if (desc) {
        description = desc[1].trim();
        continue;
      }
      const key = /^\s{2}([A-Za-z_$][\w$]*)\s*\??\s*:/.exec(line);
      if (!key) continue;
      props.set(kebab(key[1]), { name: kebab(key[1]), description });
      description = "";
    }
  }
  return props;
}

/** The event names of every `declare const xxxEmits` in a declaration file. */
function emitsOfDeclaration(text) {
  const emits = new Set();
  for (const m of text.matchAll(/declare\s+const\s+\w*[Ee]mits\s*:\s*\{/g)) {
    const open = text.indexOf("{", m.index);
    // An event name is a Vue event name: `update:modelValue` is one name, and
    // its case is part of it. It is not normalised the way a prop is.
    for (const name of keysOf(blockAt(text, open))) emits.add(name);
  }
  return emits;
}

/**
 * Element Plus's API, read two ways.
 *
 * `tags` holds the editor metadata, one entry per component. `dirs` holds
 * the type declarations, one entry per component directory — a directory may
 * hold several components, so this is the coarser of the two sources and the
 * one to fall back on.
 */
export function readEpApi(packageRoot) {
  const pkgPath = join(packageRoot, "package.json");
  if (!existsSync(pkgPath)) {
    throw new Error(
      `element-plus is not installed at ${packageRoot}. ` +
        `Run "npm install" in the repository root, or pass --element-plus <path>.`,
    );
  }
  const version = JSON.parse(readFileSync(pkgPath, "utf8")).version;

  const tags = new Map();
  const dirs = new Map();

  // --- the type declarations ------------------------------------------------
  const componentsRoot = join(packageRoot, "es", "components");
  if (existsSync(componentsRoot)) {
    for (const dir of readdirSync(componentsRoot, { withFileTypes: true })) {
      if (!dir.isDirectory()) continue;
      const src = join(componentsRoot, dir.name, "src");
      if (!existsSync(src)) continue;

      const props = new Map();
      const emits = new Set();
      for (const file of readdirSync(src)) {
        if (!file.endsWith(".d.ts")) continue;
        const text = readFileSync(join(src, file), "utf8");
        for (const [name, prop] of propsOfDeclaration(text)) {
          if (!props.has(name)) props.set(name, prop);
        }
        for (const name of emitsOfDeclaration(text)) emits.add(name);
      }
      if (props.size || emits.size) {
        dirs.set(dir.name, { props: [...props.values()], emits: [...emits].sort() });
      }
    }
  }

  // --- the editor metadata --------------------------------------------------
  const webTypesPath = join(packageRoot, "web-types.json");
  if (existsSync(webTypesPath)) {
    const webTypes = JSON.parse(readFileSync(webTypesPath, "utf8"));
    for (const tag of webTypes.contributions?.html?.["vue-components"] ?? []) {
      const label = String(tag.name);
      const props = [];
      const tables = [];
      for (const p of tag.props ?? []) {
        // Element Plus writes a name in brackets for the sub-tables its own
        // documentation carries — `[input props]`, `[tooltip]`, `[props]`.
        // They are not props: they are a pointer to another table. Two of
        // them say in words which component they inherit from, and those two
        // are followed.
        if (String(p.name).startsWith("[")) {
          tables.push({ name: String(p.name), description: p.description ?? "" });
          continue;
        }
        props.push({ name: kebab(p.name), description: p.description ?? "" });
      }
      const slots = (tag.slots ?? [])
        .map((s) => kebab(s.name))
        .filter((name) => !name.startsWith("["));
      // The existing merges, so the two halves of a component the metadata
      // lists twice end up as one component.
      const existing = tags.get(label);
      if (existing) {
        for (const prop of props) {
          if (!existing.props.some((p) => p.name === prop.name)) existing.props.push(prop);
        }
        for (const slot of slots) if (!existing.slots.includes(slot)) existing.slots.push(slot);
        for (const table of tables) existing.tables.push(table);
        continue;
      }
      tags.set(label, {
        label,
        props,
        slots,
        tables,
        emits: [],
        source: "web-types",
      });
    }
  }

  return { version, tags, dirs };
}

/**
 * The component a bracketed table inherits from, when it says so.
 *
 * Element Plus states two of them in words: the autocomplete and the mention
 * inherit the input's attributes, and the popover and the popconfirm inherit
 * the tooltip's. The rest — `[props]`, `[tag-tooltip]`, `[resizable]` — point
 * at a sub-table without saying which component it belongs to, and are left
 * alone rather than guessed at.
 */
export function inheritedFrom(tableName) {
  const named = tableName.replace(/^\[|\]$/g, "").trim().toLowerCase();
  if (named === "input props") return "el-input";
  if (named === "tooltip") return "el-tooltip";
  return null;
}

/**
 * The API of one Element Plus component.
 *
 * The identifier is either a tag from the editor metadata (`el-button`) or a
 * component directory (`message-box`), which is how the components the
 * metadata does not cover are reached.
 */
export function resolveEp(api, identifier) {
  const tag = api.tags.get(identifier);
  if (tag) {
    // The editor metadata does not list events, but the declarations do, and
    // the two describe the same component.
    const dir = api.dirs.get(identifier.replace(/^el-/, ""));
    const emits = [...new Set([...(dir?.emits ?? []), ...tag.emits])].sort();
    return { ...tag, emits };
  }

  const dirName = identifier.replace(/^el-/, "");
  const dir = api.dirs.get(dirName);
  if (dir) {
    return {
      label: identifier.startsWith("el-") ? identifier : `el-${dirName}`,
      props: dir.props,
      slots: [],
      emits: dir.emits,
      source: "declarations",
    };
  }
  return null;
}
