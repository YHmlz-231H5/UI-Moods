// ui-moods · Menu
//
// The manifest has no way to say which entry is current other than by its
// label, so the wrapper matches an entry's text against the `active` prop
// and paints um-menu__active on it. The icon slot is an empty span inside
// the group's summary: the library ships no glyph, it only holds the space
// so the text does not move.

import { defineComponent, cloneVNode, h } from "vue";

/** The text of a vnode, so the current entry can be found by its label. */
function textOf(vnode) {
  if (!vnode) return "";
  if (typeof vnode.children === "string") return vnode.children;
  if (Array.isArray(vnode.children)) return vnode.children.map(textOf).join("");
  return "";
}

export const UMMenu = defineComponent({
  name: "UMMenu",
  example: "vertical",
  props: {
    direction: { type: String, default: "vertical" },
    active: { type: String, default: "" },
  },
  setup(props, { slots }) {
    return () => {
      const entries = slots.default ? slots.default() : [];
      const items = entries.length ? entries : fallbackEntries(props, slots);
      return h(
        "ul",
        {
          class: ["um-menu", props.direction === "horizontal" ? "um-menu--horizontal" : null],
        },
        items.map((entry, i) =>
          props.active && textOf(entry) === props.active
            ? cloneVNode(entry, { class: "um-menu__active" })
            : entry,
        ),
      );
    };
  },
});

/**
 * The menu with nothing in it.
 *
 * The shape is the documented one: two plain entries and a group whose
 * summary holds the icon slot.
 */
function fallbackEntries(props, slots) {
  return [
    h("li", { class: "um-menu__item um-menu__active" }, [
      h("a", { class: "um-menu__link", href: "#" }),
    ]),
    h("li", { class: "um-menu__item" }, [h("a", { class: "um-menu__link", href: "#" })]),
    h("li", { class: "um-menu__group" }, [
      h("details", { open: true }, [
        h("summary", { class: "um-menu__title" }, [
          h("span", { class: "um-menu__icon", "aria-hidden": "true" }),
          ...(slots.icon ? slots.icon() : []),
        ]),
        h("ul", { class: "um-menu__submenu" }, [
          h("li", { class: "um-menu__item" }, [h("a", { class: "um-menu__link", href: "#" })]),
          h("li", { class: "um-menu__item" }, [h("a", { class: "um-menu__link", href: "#" })]),
        ]),
      ]),
    ]),
  ];
}
