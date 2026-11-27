// ui-moods · Descriptions
//
// A definition list of label and value pairs. Two of the things a class name
// cannot carry are measurements, so the column count and the width of the
// label column travel as the custom properties the stylesheet already reads.
// The pairs are the caller's own elements and the wrapper keeps the shell
// around them; the item slot is the way to write one pair on its own.

import { defineComponent, cloneVNode, h } from "vue";

/** The two forms the list can take; the plain one is the base class. */
const VARIANTS = ["plain", "bordered"];

export const UMDescriptions = defineComponent({
  name: "UMDescriptions",
  example: "pairs",
  props: {
    variant: { type: String, default: "plain" },
    columns: { type: Number, default: 1 },
    labelWidth: { type: String, default: "6em" },
  },
  setup(props, { slots }) {
    return () => {
      const pairs = slots.default ? slots.default() : [];
      return h(
        "dl",
        {
          class: ["um-descriptions", VARIANTS.includes(props.variant) ? `um-descriptions--${props.variant}` : null],
          style: {
            "--um-descriptions-columns": String(props.columns),
            "--um-descriptions-label-width": props.labelWidth,
          },
        },
        pairs.length ? pairs : [fallbackPair(slots.item)],
      );
    };
  },
});

/**
 * The list with nothing in it.
 *
 * The item slot carries one label and its value, so the wrapper writes the
 * classes on the two elements the slot returns.
 */
function fallbackPair(item) {
  const content = item ? item({ index: 0 }) : [];
  if (!content.length) {
    return h("div", { class: "um-descriptions__item" }, [
      h("dt", { class: "um-descriptions__label" }),
      h("dd", { class: "um-descriptions__content" }),
    ]);
  }
  return h(
    "div",
    { class: "um-descriptions__item" },
    content.map((vnode) => paint(vnode)),
  );
}

/**
 * The class a label or a value carries.
 *
 * A dt is the label and a dd is the value, so the wrapper knows which is
 * which without the caller having to say it.
 */
function paint(vnode) {
  if (!vnode || typeof vnode !== "object") return vnode;
  if (vnode.type === "dt") return cloneVNode(vnode, { class: "um-descriptions__label" });
  if (vnode.type === "dd") return cloneVNode(vnode, { class: "um-descriptions__content" });
  return vnode;
}
