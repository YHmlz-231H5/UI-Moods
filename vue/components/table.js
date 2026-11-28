// ui-moods · Table
//
// The frame belongs to the wrapper and the lines to the cells, so the wrapper
// keeps the shell — the scrolling box, the table, the head and the body — and
// the rows are the caller's own elements. A table with no rows still has to
// say so, so the empty cell is written by the wrapper and it spans as many
// columns as the head has.
//
// The modifiers are the table's own: the two variants, the two sizes that need
// a class, and the three states the reader can be in. A state that turns
// something off is written the other way round — `um-table--no-header` — so
// the class on the element always says what it does to it.

import { defineComponent, h } from "vue";

/** The two modifiers are independent, so they may be used together. */
const VARIANTS = ["striped", "bordered"];

/** The sizes that need a modifier class; the middle one is the base class. */
const SIZES = ["sm", "lg"];

/** The extra columns the stylesheet paints. */
const TYPES = ["selection", "index", "expand"];

export const UMTable = defineComponent({
  name: "UMTable",
  example: "table",
  props: {
    variant: { type: String, default: "" },
    emptyText: { type: String, default: "No data" },
    stripe: { type: Boolean, default: false },
    border: { type: Boolean, default: false },
    size: { type: String, default: "md" },
    showHeader: { type: Boolean, default: true },
    highlightCurrentRow: { type: Boolean, default: false },
    showSummary: { type: Boolean, default: false },
    align: { type: String, default: "start" },
    fit: { type: Boolean, default: false },
    type: { type: String, default: "" },
    defaultExpandAll: { type: Boolean, default: false },
    scrollbarAlwaysOn: { type: Boolean, default: false },
  },
  setup(props, { slots }) {
    return () => {
      const headers = slots.header ? slots.header() : [];
      const rows = slots.default ? slots.default() : [];
      const columns = Math.max(headers.length, 1);

      // Every record may open up to something. The area under it is in the
      // markup either way — the table decides whether it is drawn.
      const body = rows.length
        ? rows.flatMap((row, index) => [row, expandArea(slots, columns, index)])
        : [emptyRow(props, slots, columns), expandArea(slots, columns, 0)];
      if (slots.append) body.push(appendRow(slots, columns));

      return h("div", { class: "um-table__wrapper" }, [
        h(
          "table",
          {
            class: ["um-table", ...modifiers(props)],
          },
          [
            h("thead", { class: "um-table__header" }, [
              h("tr", { class: "um-table__row" }, headers.length ? headers : [
                h("th", { class: "um-table__cell", scope: "col" }),
              ]),
            ]),
            h("tbody", { class: "um-table__body" }, body),
            h("tfoot", { class: "um-table__summary" }, slots.summary ? summaryRow(slots, columns) : []),
          ],
        ),
      ]);
    };
  },
});

/**
 * The classes the props ask for.
 *
 * A variant can be asked for twice — once by name, once by the boolean that
 * means the same thing — and the class is written once either way.
 */
function modifiers(props) {
  const variants = props.variant.split(/\s+/).filter((v) => VARIANTS.includes(v));
  const classes = [];

  if (variants.includes("striped") || props.stripe) classes.push("um-table--striped");
  if (variants.includes("bordered") || props.border) classes.push("um-table--bordered");
  if (SIZES.includes(props.size)) classes.push(`um-table--${props.size}`);
  if (!props.showHeader) classes.push("um-table--no-header");
  if (props.highlightCurrentRow) classes.push("um-table--highlight-current");
  if (!props.showSummary) classes.push("um-table--no-summary");
  if (props.align === "center") classes.push("um-table--align-center");
  if (props.align === "end") classes.push("um-table--align-end");
  if (props.fit) classes.push("um-table--fit");
  if (TYPES.includes(props.type)) classes.push(`um-table--type-${props.type}`);
  if (props.defaultExpandAll) classes.push("um-table--default-expand-all");
  if (props.scrollbarAlwaysOn) classes.push("um-table--scrollbar-always-on");

  return classes;
}

/**
 * The area under a record that the record opens up to.
 *
 * It is not drawn until the record above it is marked as open, or until the
 * table is told to open them all.
 */
function expandArea(slots, columns, index) {
  return h("tr", { class: "um-table__expand" }, [
    h(
      "td",
      { class: "um-table__cell", colspan: String(columns) },
      slots.expand ? slots.expand({ row: index }) : [],
    ),
  ]);
}

/** The row that says there is nothing to show. */
function emptyRow(props, slots, columns) {
  const content = slots.empty ? slots.empty() : props.emptyText;
  return h("tr", { class: "um-table__row" }, [
    h("td", { class: "um-table__cell um-table__empty", colspan: String(columns) }, content),
  ]);
}

/** The row under the last record: where "load more" and the like live. */
function appendRow(slots, columns) {
  return h("tr", { class: "um-table__row" }, [
    h("td", { class: "um-table__cell um-table__append", colspan: String(columns) }, slots.append()),
  ]);
}

/** The row at the foot of the table: the totals. */
function summaryRow(slots, columns) {
  return [
    h("tr", { class: "um-table__row" }, [
      h("td", { class: "um-table__cell", colspan: String(columns) }, slots.summary()),
    ]),
  ];
}
