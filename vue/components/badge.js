// ui-moods · Badge
//
// The neutral badge is the base class on its own, so the variant stays empty
// until the caller asks for a colour and the wrapper paints a modifier class
// only when there is one to paint.
//
// The count is the badge's own text, so a zero count is read from it: a badge
// that counts nothing has nothing to say, unless the host asks for it to
// stay. The hidden state is the native hidden attribute, so the badge leaves
// the reader's eye as well as the page.

import { defineComponent, h } from "vue";

export const UMBadge = defineComponent({
  name: "UMBadge",
  example: "variants",
  props: {
    variant: { type: String, default: "" },
    dot: { type: Boolean, default: false },
    isDot: { type: Boolean, default: false },
    hidden: { type: Boolean, default: false },
    showZero: { type: Boolean, default: false },
  },
  setup(props, { slots }) {
    return () => {
      // Element Plus calls the badge's own text the content slot; the library
      // calls it the default slot. Both fill the same place, and the longer
      // name wins when a host uses both.
      const label = slots.content ? slots.content() : slots.default ? slots.default() : [];
      const isZero = textOf(label).trim() === "0";

      return h(
        "span",
        {
          class: [
            "um-badge",
            props.variant ? `um-badge--${props.variant}` : null,
            props.isDot ? "um-badge--is-dot" : null,
          ],
          hidden: props.hidden || (!props.showZero && isZero),
        },
        [
          ...(props.dot ? [h("span", { class: "um-badge__dot" })] : []),
          ...(props.isDot ? [] : label),
        ],
      );
    };
  },
});

/**
 * The text of a slot's content.
 *
 * Only the text nodes are read: a host that fills the badge with a component
 * has a count the wrapper cannot see, and a count it cannot see is not a zero.
 */
function textOf(nodes) {
  return nodes
    .map((node) => (typeof node?.children === "string" ? node.children : ""))
    .join("");
}
