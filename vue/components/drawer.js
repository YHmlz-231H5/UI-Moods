// ui-moods · Drawer
//
// The panel is an <aside> that names itself with its own title, so two
// drawers on one page tell themselves apart. A drawer is not a dialog: the
// browser has no close of its own to offer, so the close button does what
// the host tells it to — it emits, and the host takes the panel away.
//
// The panel answers to `v-model` as well: a host that binds it gets the
// panel back when the close button is pressed, and a host that writes
// `:model-value` gets exactly what it got before.

import { defineComponent, h, useId } from "vue";
import { modelValue } from "../lib/model.mjs";

export const UMDrawer = defineComponent({
  name: "UMDrawer",
  example: "basic",
  props: {
    direction: { type: String, default: "right" },
    size: { type: String, default: "md" },
    inline: { type: Boolean, default: false },
    title: { type: String, default: "" },
    modelValue: { type: Boolean, default: undefined },
    showClose: { type: Boolean, default: true },
    withHeader: { type: Boolean, default: true },
  },
  emits: ["close", "update:modelValue"],
  setup(props, { slots, emit }) {
    const titleId = `um-drawer-title-${useId()}`;

    return () => {
      const open = modelValue(props, true);

      return h(
        "aside",
        {
          class: [
            "um-drawer",
            props.direction !== "right" ? `um-drawer--${props.direction}` : null,
            props.size !== "md" ? `um-drawer--${props.size}` : null,
            props.inline ? "um-drawer--inline" : null,
          ],
          hidden: !open,
          "aria-labelledby": titleId,
        },
        [
          props.withHeader
            ? h("div", { class: "um-drawer__header" }, [
                h(
                  "h2",
                  { class: "um-drawer__title", id: titleId },
                  slots.header ? slots.header() : slots.title ? slots.title() : props.title,
                ),
                props.showClose
                  ? h("button", {
                      class: "um-drawer__close",
                      type: "button",
                      "aria-label": "Close",
                      onClick: () => {
                        emit("update:modelValue", false);
                        emit("close");
                      },
                    })
                  : null,
              ])
            : null,
          h("div", { class: "um-drawer__body" }, slots.default ? slots.default() : []),
          h("div", { class: "um-drawer__footer" }, slots.footer ? slots.footer() : []),
        ],
      );
    };
  },
});
