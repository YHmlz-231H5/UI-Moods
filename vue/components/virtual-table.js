// ui-moods · Virtual Table
//
// The wrapper writes the rows the host's list has and lets the stylesheet skip
// the ones the reader cannot see. It does not window the list itself: the
// browser already refuses to lay out a row that is far from the viewport, and
// every row stays in the document so the row count the host says there is
// matches what a screen reader finds.
//
// The table is an ARIA grid of divs rather than a real <table>. A browser will
// not skip the layout of a table row, because a row is sized by its table —
// the measurement that decided it is in the manifest's notes.
//
// The empty state replaces the rows rather than sitting under them, so a table
// with nothing in it says so instead of showing a scroll bar over nothing.

import { defineComponent, h } from "vue";

/** The variants the stylesheet paints. */
const VARIANTS = ["bordered", "plain"];

/** The value a cell holds. The wrapper has no data model, so it writes a
 *  plausible one: a name, a number, a state. */
function cellValue(row, column) {
  if (column === 0) return `node-${String(row + 1).padStart(2, "0")}`;
  if (column === 1) return String(210 + row);
  if (column === 2) return row % 7 === 3 ? "failed" : "passing";
  return `column ${column + 1}`;
}

export const UMVirtualTable = defineComponent({
  name: "UMVirtualTable",
  example: "table",
  props: {
    variant: { type: String, default: "plain" },
    size: { type: String, default: "md" },
    rows: { type: Number, default: 200 },
    columns: { type: String, default: "Node, Build, State" },
    height: { type: String, default: "16em" },
    empty: { type: Boolean, default: false },
  },
  setup(props) {
    return () => {
      const names = props.columns
        .split(",")
        .map((name) => name.trim())
        .filter(Boolean);
      const count = Math.max(0, Math.floor(props.rows));

      const header = h(
        "div",
        { class: "um-virtual-table__header", role: "row" },
        names.map((name) =>
          h("span", { class: "um-virtual-table__head-cell", role: "columnheader" }, name),
        ),
      );

      const body = props.empty
        ? [
            h(
              "div",
              { class: "um-virtual-table__row um-virtual-table__empty", role: "row" },
              [
                h(
                  "span",
                  {
                    class: "um-virtual-table__cell",
                    role: "gridcell",
                    "aria-colspan": String(Math.max(names.length, 1)),
                  },
                  "No data",
                ),
              ],
            ),
          ]
        : Array.from({ length: count }, (_, row) =>
            h(
              "div",
              { class: "um-virtual-table__row", role: "row" },
              names.map((_, column) =>
                h(
                  "span",
                  { class: "um-virtual-table__cell", role: "gridcell" },
                  cellValue(row, column),
                ),
              ),
            ),
          );

      return h(
        "div",
        {
          class: [
            "um-virtual-table",
            VARIANTS.includes(props.variant) ? `um-virtual-table--${props.variant}` : null,
            sizeClass(props.size),
          ],
        },
        [
          h(
            "div",
            {
              class: "um-virtual-table__scroller",
              role: "grid",
              "aria-label": "Records",
              "aria-rowcount": String(props.empty ? 0 : count),
              "aria-colcount": String(names.length),
              tabindex: "0",
              style: { height: props.height },
            },
            [header, h("div", { class: "um-virtual-table__body", role: "rowgroup" }, body)],
          ),
        ],
      );
    };
  },
});

/** The medium size is the base class on its own. */
function sizeClass(size) {
  if (size === "sm") return "um-virtual-table--sm";
  if (size === "lg") return "um-virtual-table--lg";
  return null;
}
