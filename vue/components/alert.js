// ui-moods · Alert
//
// An alert is five elements: the icon, the mark chip, the body, the title and
// the description — and, when the alert can be closed, the close button.
//
// The icon and the close button are in the markup either way, and the classes
// are what show them: the stylesheet decides what a panel carries, so a host
// that writes the markup by hand gets the same alert the wrapper draws.

import { defineComponent, h } from "vue";

export const UMAlert = defineComponent({
  name: "UMAlert",
  example: "variants",
  props: {
    variant: { type: String, default: "primary" },
    center: { type: Boolean, default: false },
    closable: { type: Boolean, default: false },
    showIcon: { type: Boolean, default: false },
  },
  emits: ["close"],
  setup(props, { slots, emit }) {
    return () =>
      h(
        "div",
        {
          class: [
            "um-alert",
            `um-alert--${props.variant}`,
            props.center ? "um-alert--center" : null,
            props.closable ? "um-alert--closable" : null,
            props.showIcon ? "um-alert--show-icon" : null,
          ],
        },
        [
          h("span", { class: "um-alert__icon" }),
          h("span", { class: "um-alert__mark" }, slots.mark ? slots.mark() : []),
          h("div", { class: "um-alert__body" }, [
            h("span", { class: "um-alert__title" }, slots.title ? slots.title() : []),
            h("span", { class: "um-alert__description" }, slots.default ? slots.default() : []),
          ]),
          // The button is real, so it is in the tab order. What closing the
          // alert means is the host's business: the wrapper only reports it.
          h("button", {
            class: "um-alert__close",
            type: "button",
            "aria-label": "Close",
            onClick: () => emit("close"),
          }),
        ],
      );
  },
});
