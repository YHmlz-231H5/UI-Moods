// ui-moods · Table
//
// The frame belongs to the wrapper and the lines to the cells, so the wrapper
// keeps the shell — the scrolling box, the table, the head and the body — and
// the rows are the caller's own elements. A table with no rows still has to
// say so, so the empty cell is written by the wrapper and it spans as many
// columns as the head has.

import { defineComponent, h } from "vue";

/** The two modifiers are independent, so they may be used together. */
const VARIANTS = ["striped", "bordered"];

export const UMTable = defineComponent({
  name: "UMTable",
  example: "table",
  props: {
    variant: { type: String, default: "" },
    emptyText: { type: String, default: "No data" },
  },
  setup(props, { slots }) {
    return () => {
      const headers = slots.header ? slots.header() : [];
      const rows = slots.default ? slots.default() : [];

      return h("div", { class: "um-table__wrapper" }, [
        h(
          "table",
          {
            class: [
              "um-table",
              ...props.variant
                .split(/\s+/)
                .filter((v) => VARIANTS.includes(v))
                .map((v) => `um-table--${v}`),
            ],
          },
          [
            h("thead", { class: "um-table__header" }, [
              h("tr", { class: "um-table__row" }, headers.length ? headers : [
                h("th", { class: "um-table__cell", scope: "col" }),
              ]),
            ]),
            h("tbody", { class: "um-table__body" }, rows.length ? rows : [emptyRow(props.emptyText, headers.length)]),
          ],
        ),
      ]);
    };
  },
});

/** The row that says there is nothing to show. */
function emptyRow(text, columns) {
  return h("tr", { class: "um-table__row" }, [
    h("td", { class: "um-table__cell um-table__empty", colspan: String(Math.max(columns, 1)) }, text),
  ]);
}
