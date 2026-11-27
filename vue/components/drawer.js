// ui-moods · Drawer
//
// The panel is an <aside> that names itself with its own title, so two
// drawers on one page tell themselves apart. A drawer is not a dialog: the
// browser has no close of its own to offer, so the close button does what
// the host tells it to — it emits, and the host takes the panel away.

import { defineComponent, h, useId } from "vue";

export const UMDrawer = defineComponent({
  name: "UMDrawer",
  example: "basic",
  props: {
    direction: { type: String, default: "right" },
    size: { type: String, default: "md" },
    inline: { type: Boolean, default: false },
    title: { type: String, default: "" },
  },
  emits: ["close"],
  setup(props, { slots, emit }) {
    const titleId = `um-drawer-title-${useId()}`;

    return () =>
      h(
        "aside",
        {
          class: [
            "um-drawer",
            props.direction !== "right" ? `um-drawer--${props.direction}` : null,
            props.size !== "md" ? `um-drawer--${props.size}` : null,
            props.inline ? "um-drawer--inline" : null,
          ],
          "aria-labelledby": titleId,
        },
        [
          h("div", { class: "um-drawer__header" }, [
            h(
              "h2",
              { class: "um-drawer__title", id: titleId },
              slots.title ? slots.title() : props.title,
            ),
            h("button", {
              class: "um-drawer__close",
              type: "button",
              "aria-label": "Close",
              onClick: () => emit("close"),
            }),
          ]),
          h("div", { class: "um-drawer__body" }, slots.default ? slots.default() : []),
          h("div", { class: "um-drawer__footer" }, slots.footer ? slots.footer() : []),
        ],
      );
  },
});
