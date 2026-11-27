// ui-moods · Message
//
// Element Plus's message is a function: the page calls it and the library
// paints a bar. Here the bar is the component, so the wrapper paints the
// state, the size and the three parts, and leaves the sentence to the slot.
//
// The bar carries no role of its own. A message that arrives without the
// reader asking for it needs role="status" — or role="alert" when the news is
// urgent — and the host knows which of the two it is.

import { defineComponent, h } from "vue";

/** The states the stylesheet paints. */
const VARIANTS = ["info", "success", "warning", "error"];

export const UMMessage = defineComponent({
  name: "UMMessage",
  example: "variants",
  props: {
    variant: { type: String, default: "info" },
    size: { type: String, default: "md" },
    closable: { type: Boolean, default: false },
  },
  setup(props, { slots }) {
    return () =>
      h(
        "div",
        {
          class: [
            "um-message",
            VARIANTS.includes(props.variant) ? `um-message--${props.variant}` : null,
            sizeClass(props.size),
          ],
        },
        [
          // The disc repeats what the sentence already says, so it is hidden
          // from the reader.
          h("span", { class: "um-message__icon", "aria-hidden": "true" }),
          h("div", { class: "um-message__content" }, slots.default ? slots.default() : []),
          props.closable
            ? h("button", {
                class: "um-message__close",
                type: "button",
                "aria-label": "Dismiss",
              })
            : null,
        ],
      );
  },
});

/** The medium size is the base class on its own. */
function sizeClass(size) {
  if (size === "sm") return "um-message--sm";
  if (size === "lg") return "um-message--lg";
  return null;
}
