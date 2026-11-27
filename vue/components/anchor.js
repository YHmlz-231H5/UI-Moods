// ui-moods · Anchor
//
// The manifest describes the column but gives it no way to say how many
// sections there are, so the entries arrive through the default slot: the
// host writes the <a> to the fragment, and the wrapper builds the nav, the
// list and the items around them.

import { defineComponent, cloneVNode, h } from "vue";

/**
 * One entry of the column.
 *
 * The host writes the element — an `<a>` to the fragment of a section — and
 * the wrapper adds the class the stylesheet paints it with. Anything that
 * is not an element (a stray text node) becomes an empty link, so the column
 * always has a shape.
 */
function anchorLink(entry) {
  if (!entry || typeof entry.type !== "string") {
    return h("a", { class: "um-anchor__link", href: "#" });
  }
  return cloneVNode(entry, { class: "um-anchor__link" });
}

export const UMAnchor = defineComponent({
  name: "UMAnchor",
  example: "basic",
  props: {
    variant: { type: String, default: "line" },
    label: { type: String, default: "Anchor" },
  },
  setup(props, { slots }) {
    return () => {
      const entries = slots.default ? slots.default() : [];
      // A column of nothing is not a column: the fallback keeps one entry so
      // the rule and the rhythm are visible.
      const list = entries.length ? entries : [null];
      return h(
        "nav",
        {
          class: ["um-anchor", props.variant === "plain" ? "um-anchor--plain" : null],
          "aria-label": props.label,
        },
        [
          h(
            "ul",
            { class: "um-anchor__list" },
            list.map((entry, i) =>
              h("li", { class: "um-anchor__item", key: i }, [anchorLink(entry)]),
            ),
          ),
        ],
      );
    };
  },
});
