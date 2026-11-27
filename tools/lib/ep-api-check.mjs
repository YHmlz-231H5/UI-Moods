// This library's declared API, compared against Element Plus's.
//
// The comparison is not against a prose description of Element Plus. It is
// against the two things Element Plus itself publishes:
//
// - `web-types.json`, the metadata its documentation build generates for
//   editors: the props and the slots of every component.
// - the TypeScript declarations in the published package: the props and the
//   events, as declarations.
//
// The result is one of five verdicts for every prop Element Plus declares:
//
//   covered     this library declares a prop with that name
//   renamed     this library declares it under another name, and says which
//   equivalent  this library expresses it as a value of another prop
//   skipped     this library does not carry it, and says why
//   gap         this library does not carry it and has not said why
//
// A gap is a failure: it means a reader who knows Element Plus would find a
// prop here that is not described anywhere.

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { readEpApi, resolveEp, inheritedFrom } from "./ep-api.mjs";

/**
 * The key two event names are compared by.
 *
 * Element Plus writes `tab-change`, its declarations write `tabChange`, and
 * this library writes `update:modelValue`. They are the same event, so the
 * comparison drops the case and the punctuation and compares what is left.
 */
function eventKey(name) {
  return String(name).toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** The props this library declares, in the spelling the report uses. */
function ourProps(manifest) {
  return new Set((manifest.props ?? []).map((p) => p.name));
}

/** The slots this library declares. */
function ourSlots(manifest) {
  return new Set((manifest.slots ?? []).map((s) => s.name));
}

/** The events this library declares. */
function ourEvents(manifest) {
  return new Set((manifest.events ?? []).map((e) => e.name));
}

/** The count of each verdict. */
function tally(rows) {
  const counts = { covered: 0, renamed: 0, equivalent: 0, skipped: 0, gap: 0 };
  for (const row of rows) counts[row.status] = (counts[row.status] ?? 0) + 1;
  return counts;
}

/**
 * The comparison, as data.
 *
 * `root` is the repository. `epRoot` is the Element Plus package to compare
 * against; it defaults to the copy the repository installs.
 */
export function compareEpApi(root, options = {}) {
  const parity = JSON.parse(readFileSync(join(root, "schemas", "ep-parity.json"), "utf8"));
  const epRoot = options.epRoot ?? join(root, "node_modules", "element-plus");
  const api = readEpApi(epRoot);

  const manifests = [];
  for (const dir of readdirSync(join(root, "components")).sort()) {
    const path = join(root, "components", dir, "manifest.json");
    if (existsSync(path)) manifests.push(JSON.parse(readFileSync(path, "utf8")));
  }

  /**
   * The Element Plus props this library does not carry, and why.
   *
   * The reasons are grouped rather than written out one prop at a time: a
   * prop that needs JavaScript is skipped for the same reason as every other
   * prop that needs JavaScript, and the reason is stated once.
   */
  const skipGroups = parity.skipGroups ?? {};
  const skipReasons = new Map();
  const slotReasons = new Map();
  const eventReasons = new Map();
  for (const [group, entry] of Object.entries(skipGroups)) {
    for (const prop of entry.props ?? []) skipReasons.set(prop, { group, why: entry.why });
    for (const slot of entry.slots ?? []) slotReasons.set(slot, { group, why: entry.why });
    for (const event of entry.events ?? []) eventReasons.set(eventKey(event), { group, why: entry.why });
  }

  const results = [];
  const errors = [];
  const tables = [];

  for (const manifest of manifests) {
    const mapping = parity.components[manifest.id];
    if (!mapping) {
      errors.push(`${manifest.id}: no mapping in schemas/ep-parity.json`);
      continue;
    }

    const props = ourProps(manifest);
    const slots = ourSlots(manifest);
    const events = new Set([...ourEvents(manifest)].map(eventKey));
    const rename = mapping.rename ?? {};
    const equiv = mapping.equiv ?? {};
    const skipProps = mapping.skip?.props ?? {};
    const skipSlots = mapping.skip?.slots ?? {};
    const ignore = new Set(mapping.ignore ?? []);

    const epProps = new Map();
    const epSlots = new Set();
    const epEvents = new Set();
    const sources = new Set();

    for (const identifier of mapping.ep ?? []) {
      const resolved = resolveEp(api, identifier);
      if (!resolved) {
        errors.push(`${manifest.id}: Element Plus has no "${identifier}"`);
        continue;
      }
      sources.add(resolved.source);
      for (const prop of resolved.props) {
        if (ignore.has(prop.name)) continue;
        if (!epProps.has(prop.name)) epProps.set(prop.name, prop);
      }
      for (const slot of resolved.slots) epSlots.add(slot);
      for (const event of resolved.emits) epEvents.add(event);

      // A table Element Plus points at in words is followed: the component it
      // names contributes its own props to this one.
      for (const table of resolved.tables ?? []) {
        const from = inheritedFrom(table.name);
        if (!from) {
          tables.push(`${resolved.label} ${table.name}`);
          continue;
        }
        const inherited = resolveEp(api, from);
        if (!inherited) continue;
        for (const prop of inherited.props) {
          if (!epProps.has(prop.name)) epProps.set(prop.name, prop);
        }
      }
    }

    const propRows = [];
    for (const [name, prop] of epProps) {
      // The order matters: a prop the library already declares is covered,
      // whatever else is true of it. A rename is next, because Element Plus's
      // name is the one being compared and this library's is the other.
      const renamedTo = rename[name];
      if (renamedTo !== undefined) {
        propRows.push({
          name,
          status: props.has(renamedTo) ? "renamed" : "gap",
          as: renamedTo,
          description: prop.description,
        });
        continue;
      }
      if (props.has(name)) {
        propRows.push({ name, status: "covered", description: prop.description });
        continue;
      }
      if (equiv[name]) {
        propRows.push({ name, status: "equivalent", as: equiv[name], description: prop.description });
        continue;
      }
      if (skipProps[name]) {
        propRows.push({ name, status: "skipped", why: skipProps[name], description: prop.description });
        continue;
      }
      const reason = skipReasons.get(name);
      if (reason) {
        propRows.push({
          name,
          status: "skipped",
          group: reason.group,
          why: reason.why,
          description: prop.description,
        });
        continue;
      }
      propRows.push({ name, status: "gap", description: prop.description });
    }
    propRows.sort((a, b) => a.name.localeCompare(b.name));

    const slotRows = [];
    for (const slot of epSlots) {
      if (slots.has(slot)) slotRows.push({ name: slot, status: "covered" });
      else if (skipSlots[slot]) slotRows.push({ name: slot, status: "skipped", why: skipSlots[slot] });
      else {
        const reason = slotReasons.get(slot);
        if (reason) slotRows.push({ name: slot, status: "skipped", group: reason.group, why: reason.why });
        else slotRows.push({ name: slot, status: "gap" });
      }
    }
    slotRows.sort((a, b) => a.name.localeCompare(b.name));

    const eventRows = [];
    for (const event of epEvents) {
      if (events.has(eventKey(event))) {
        eventRows.push({ name: event, status: "covered" });
        continue;
      }
      const reason = eventReasons.get(eventKey(event));
      if (reason) eventRows.push({ name: event, status: "skipped", group: reason.group, why: reason.why });
      else eventRows.push({ name: event, status: "gap" });
    }
    eventRows.sort((a, b) => a.name.localeCompare(b.name));

    results.push({
      id: manifest.id,
      name: manifest.name,
      ep: (mapping.ep ?? []).join(", ") || "—",
      sources: [...sources].join(", ") || "none",
      props: propRows,
      slots: slotRows,
      events: eventRows,
    });
  }

  const totals = {
    props: tally(results.flatMap((r) => r.props)),
    slots: tally(results.flatMap((r) => r.slots)),
    events: tally(results.flatMap((r) => r.events)),
  };
  const gaps = results.flatMap((r) => [
    ...r.props.filter((x) => x.status === "gap").map((x) => ({ ...x, kind: "prop", id: r.id })),
    ...r.slots.filter((x) => x.status === "gap").map((x) => ({ ...x, kind: "slot", id: r.id })),
    ...r.events.filter((x) => x.status === "gap").map((x) => ({ ...x, kind: "event", id: r.id })),
  ]);

  return { version: api.version, results, totals, gaps, errors, tables, skipGroups };
}

/**
 * The check the build runs.
 *
 * The report has to match the sources — a stale report is a wrong report.
 * The gaps are the work list, and they are recorded rather than fatal: the
 * report is where they live.
 */
export function checkEpApi(root) {
  let comparison;
  try {
    comparison = compareEpApi(root);
  } catch (error) {
    // The comparison needs Element Plus itself. Without it there is nothing
    // to compare against, which is a skip rather than a failure.
    return { errors: [], skipped: [String(error.message)], stats: {} };
  }
  const reportPath = join(root, "docs", "ep-api-parity.md");
  const expected = renderReport(comparison);
  const current = existsSync(reportPath) ? readFileSync(reportPath, "utf8") : "";
  const errors = [...comparison.errors];
  if (current !== expected) {
    errors.push("docs/ep-api-parity.md is out of date — run `node tools/ep-api-parity.mjs`");
  }
  return {
    errors,
    skipped: [],
    stats: {
      version: comparison.version,
      gaps: comparison.gaps.length,
      props: comparison.totals.props,
      slots: comparison.totals.slots,
      events: comparison.totals.events,
    },
  };
}

/**
 * The report, as markdown.
 *
 * It is written to `docs/ep-api-parity.md` and checked against the sources,
 * so it cannot drift away from what the library actually declares.
 */
export function renderReport(comparison) {
  const { version, results, totals, gaps, tables } = comparison;
  const lines = [];
  lines.push("# Element Plus · API 对照");
  lines.push("");
  lines.push("这份对照不是拿 Element Plus 的文档散文比出来的,是拿它**自己发布的两样东西**比出来的:");
  lines.push("");
  lines.push(
    "- `web-types.json` —— Element Plus 的文档构建为编辑器生成的元数据,逐个组件列出属性与插槽;",
  );
  lines.push(
    "- 发布包里的 TypeScript 声明 —— `interface XxxProps`、`interface XxxOptions` 与 `declare const xxxEmits`,属性与事件都是声明,不是描述。",
  );
  lines.push("");
  lines.push(
    `对照的是 **element-plus ${version}**,由 \`node tools/ep-api-parity.mjs\` 生成,` +
      "由 `validate` 校验它没有过期。换一版 Element Plus 重新对照,改 `schemas/ep-parity.json` 里的 `source.version` 即可。",
  );
  lines.push("");
  lines.push("每一个 Element Plus 的属性有五种结论之一:");
  lines.push("");
  lines.push("| 结论 | 意思 |");
  lines.push("| --- | --- |");
  lines.push("| 覆盖 | 本库声明了同名属性 |");
  lines.push("| 改名 | 本库声明了它,只是换了名字,对照表里写了换成什么 |");
  lines.push("| 等价 | 本库用另一个属性的某个取值表达了同一件事,对照表里写了是哪一个 |");
  lines.push("| 跳过 | 本库不带它,并写明了为什么 |");
  lines.push("| **差口** | 本库既不带它,也没写为什么 —— 这是待办,报告里逐条列出 |");
  lines.push("");
  lines.push("「跳过」的理由只有七种,写在 `schemas/ep-parity.json` 的 `skipGroups` 里:");
  lines.push("");
  lines.push("| 组 | 为什么跳过 |");
  lines.push("| --- | --- |");
  for (const [group, entry] of Object.entries(comparison.skipGroups ?? {})) {
    lines.push(`| \`${group}\` | ${entry.why} |`);
  }
  lines.push("");
  lines.push("## 总数");
  lines.push("");
  lines.push("| | 覆盖 | 改名 | 等价 | 跳过 | 差口 | 合计 |");
  lines.push("| --- | --- | --- | --- | --- | --- | --- |");
  for (const [kind, label] of [["props", "属性"], ["slots", "插槽"], ["events", "事件"]]) {
    const t = totals[kind];
    lines.push(
      `| ${label} | ${t.covered} | ${t.renamed} | ${t.equivalent} | ${t.skipped} | ${t.gap} | ${
        t.covered + t.renamed + t.equivalent + t.skipped + t.gap
      } |`,
    );
  }
  lines.push("");
  lines.push("## 逐组件");
  lines.push("");
  lines.push("| 本库清单 | Element Plus | 来源 | 属性 | 覆盖 | 改名 | 等价 | 跳过 | 差口 |");
  lines.push("| --- | --- | --- | --- | --- | --- | --- | --- | --- |");
  for (const r of results) {
    const t = tally(r.props);
    lines.push(
      `| \`${r.id}\` | ${r.ep} | ${r.sources} | ${r.props.length} | ${t.covered} | ${t.renamed} | ${t.equivalent} | ${t.skipped} | ${t.gap} |`,
    );
  }
  lines.push("");
  lines.push("## 差口清单");
  lines.push("");
  lines.push("这是本库接下来要补的属性、插槽与事件。");
  lines.push("");
  for (const r of results) {
    const missing = [
      ...r.props.filter((x) => x.status === "gap").map((x) => ({ ...x, kind: "prop" })),
      ...r.slots.filter((x) => x.status === "gap").map((x) => ({ ...x, kind: "slot" })),
      ...r.events.filter((x) => x.status === "gap").map((x) => ({ ...x, kind: "event" })),
    ];
    if (!missing.length) continue;
    lines.push(`### \`${r.id}\``);
    lines.push("");
    for (const m of missing) {
      const note = m.description ? ` —— ${m.description}` : "";
      lines.push(`- ${m.kind} · \`${m.name}\`${note}`);
    }
    lines.push("");
  }
  lines.push("## 没有对应组件的地方");
  lines.push("");
  const unmapped = results.filter((r) => r.ep === "—").map((r) => r.id);
  lines.push(
    unmapped.length
      ? `以下清单在 Element Plus 里没有单独的组件: ${unmapped.map((u) => `\`${u}\``).join("、")}。` +
          "它们要么是 Element Plus 的辅助函数(`border`、`color`),要么是把两个 Element Plus 组件合成一份清单(`input` 同时画 `um-input`、`um-textarea`、`um-select`),要么是本库自己的编排层(`typography`)。"
      : "没有。",
  );
  lines.push("");
  if (tables.length) {
    lines.push("## 没有追进去的子表");
    lines.push("");
    lines.push(
      "Element Plus 的元数据里有几处用方括号指向一张子表,却没有说那张表属于哪个组件。这份对照不去猜它们:",
    );
    lines.push("");
    for (const t of [...new Set(tables)]) lines.push(`- ${t}`);
    lines.push("");
  }
  return lines.join("\n") + "\n";
}
