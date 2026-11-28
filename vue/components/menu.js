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
    mode: { type: String, default: "vertical" },
    collapse: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    ellipsis: { type: Boolean, default: false },
    popperEffect: { type: String, default: "light" },
  },
  emits: ["open", "close", "select"],
  setup(props, { slots, emit }) {
    return () => {
      const entries = slots.default ? slots.default() : [];
      const items = entries.length ? entries : fallbackEntries(props, slots);
      // `mode` is Element Plus's name for the way the entries run and
      // `direction` is this library's, so either one of them says it.
      const mode = props.mode !== "vertical" ? props.mode : props.direction;
      return h(
        "ul",
        {
          class: [
            "um-menu",
            mode === "horizontal" ? "um-menu--horizontal" : null,
            props.collapse ? "um-menu--collapse" : null,
            props.disabled ? "um-menu--disabled" : null,
            props.ellipsis ? "um-menu--ellipsis" : null,
            // The light popper is the base class on its own.
            props.popperEffect === "dark" ? "um-menu--popper-dark" : null,
          ],
          // The toggle event of a group does not bubble, so it is caught on
          // the way down instead of on the way up.
          onToggleCapture: (e) => {
            if (!e.target || e.target.tagName !== "DETAILS") return;
            emit(e.target.open ? "open" : "close", e);
          },
          onClick: (e) => {
            const item = e.target?.closest?.(".um-menu__item");
            if (item) emit("select", item.textContent?.trim() ?? "", e);
          },
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
          ...(slots.title ? slots.title() : []),
        ]),
        h("ul", { class: "um-menu__submenu" }, [
          h("li", { class: "um-menu__item" }, [h("a", { class: "um-menu__link", href: "#" })]),
          h("li", { class: "um-menu__item" }, [h("a", { class: "um-menu__link", href: "#" })]),
        ]),
      ]),
    ]),
  ];
}
