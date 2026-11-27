// ui-moods · Dropdown
//
// The panel is a <details>, so the browser owns the open and closed state and
// the toggle event is the browser's own. The items are the default slot:
// they are the documented markup, and the wrapper keeps the shell around
// them.

import { defineComponent, h } from "vue";

export const UMDropdown = defineComponent({
  name: "UMDropdown",
  example: "basic",
  props: {
    placement: { type: String, default: "start" },
    label: { type: String, default: "" },
    size: { type: String, default: "md" },
    disabled: { type: Boolean, default: false },
    divided: { type: Boolean, default: false },
  },
  emits: ["toggle"],
  setup(props, { slots, emit }) {
    return () =>
      h(
        "details",
        {
          class: [
            "um-dropdown",
            props.placement === "end" ? "um-dropdown--end" : null,
            props.size !== "md" ? `um-dropdown--${props.size}` : null,
            props.disabled ? "um-dropdown--disabled" : null,
            props.divided ? "um-dropdown--divided" : null,
          ],
          onToggle: (e) => emit("toggle", e),
        },
        [
          h(
            "summary",
            { class: "um-dropdown__trigger" },
            slots.trigger ? slots.trigger() : props.label,
          ),
          h(
            "div",
            { class: "um-dropdown__menu" },
            slots.dropdown
              ? slots.dropdown()
              : slots.default
                ? slots.default()
                : fallbackMenu(),
          ),
        ],
      );
  },
});

/**
 * The panel with nothing in it.
 *
 * The menu is hidden until the trigger is pressed, so the shape of the panel
 * is all that is visible — and it is the shape the stylesheet paints.
 */
function fallbackMenu() {
  return [
    h("button", { class: "um-dropdown__item", type: "button" }),
    h("button", { class: "um-dropdown__item", type: "button" }),
    h("hr", { class: "um-dropdown__divider" }),
    h("button", { class: "um-dropdown__item", type: "button" }),
  ];
}
