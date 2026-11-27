// ui-moods · Descriptions
//
// A definition list of label and value pairs. Two of the things a class name
// cannot carry are measurements, so the column count and the width of the
// label column travel as the custom properties the stylesheet already reads.
// The pairs are the caller's own elements and the wrapper keeps the shell
// around them; the item slot is the way to write one pair on its own.
//
// The title and the extra sit in a header above the list. A <dl> may only
// hold definitions, so the header is a sibling of it rather than a child —
// which is why the wrapper draws two elements.

import { defineComponent, cloneVNode, Fragment, h } from "vue";

/** The two forms the list can take; the plain one is the base class. */
const VARIANTS = ["plain", "bordered"];

/** The sizes the list can take; the medium one is the base class. */
const SIZES = ["sm", "md", "lg"];

/** The ways the pairs can line up; the start one is the base class. */
const ALIGNS = ["start", "center", "end"];

export const UMDescriptions = defineComponent({
  name: "UMDescriptions",
  example: "pairs",
  props: {
    variant: { type: String, default: "plain" },
    columns: { type: Number, default: 1 },
    labelWidth: { type: String, default: "6em" },
    align: { type: String, default: "start" },
    border: { type: Boolean, default: undefined },
    size: { type: String, default: "md" },
  },
  setup(props, { slots }) {
    return () => {
      const pairs = slots.default ? slots.default() : [];
      // The border prop is the short way of asking for the framed list; the
      // variant is the fallback when it is left out.
      const bordered =
        props.border !== undefined ? props.border : props.variant === "bordered";

      const list = h(
        "dl",
        {
          class: [
            "um-descriptions",
            bordered ? "um-descriptions--bordered" : "um-descriptions--plain",
            SIZES.includes(props.size) && props.size !== "md"
              ? `um-descriptions--${props.size}`
              : null,
            ALIGNS.includes(props.align) && props.align !== "start"
              ? `um-descriptions--align-${props.align}`
              : null,
          ],
          style: {
            "--um-descriptions-columns": String(props.columns),
            "--um-descriptions-label-width": props.labelWidth,
          },
        },
        pairs.length ? pairs.map((vnode) => paint(vnode)) : [fallbackPair(slots)],
      );

      return h(Fragment, [
        h("div", { class: "um-descriptions__header" }, [
          h("h3", { class: "um-descriptions__title" }, slots.title ? slots.title() : []),
          h("div", { class: "um-descriptions__extra" }, slots.extra ? slots.extra() : []),
        ]),
        list,
      ]);
    };
  },
});

/**
 * The list with nothing in it.
 *
 * The item slot carries one label and its value, so the wrapper writes the
 * classes on the two elements the slot returns. With no item either, the
 * label slot fills the label of the pair the wrapper writes.
 */
function fallbackPair(slots) {
  const content = slots.item ? slots.item({ index: 0 }) : [];
  if (!content.length) {
    return h("div", { class: "um-descriptions__item" }, [
      h("dt", { class: "um-descriptions__label" }, slots.label ? slots.label() : []),
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
 * The class a pair, a label or a value carries.
 *
 * A dt is the label and a dd is the value, so the wrapper knows which is
 * which without the caller having to say it. A div holds a pair, so it takes
 * the pair's own class and the two inside it take theirs.
 */
function paint(vnode) {
  if (!vnode || typeof vnode !== "object") return vnode;
  if (vnode.type === "dt") return cloneVNode(vnode, { class: "um-descriptions__label" });
  if (vnode.type === "dd") return cloneVNode(vnode, { class: "um-descriptions__content" });
  if (vnode.type === "div") {
    const children = (Array.isArray(vnode.children) ? vnode.children : [vnode.children])
      .filter(Boolean)
      .map((child) => paint(child));
    return h(
      "div",
      { ...vnode.props, class: ["um-descriptions__item", vnode.props?.class] },
      children,
    );
  }
  return vnode;
}
