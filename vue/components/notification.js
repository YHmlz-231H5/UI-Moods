// ui-moods · Notification
//
// Element Plus's notification is a function: the page calls it and the library
// shows a card. Here the card is the component, so the wrapper paints the
// state, the width and the four parts, and leaves the heading and the body to
// the caller.
//
// The card carries no role of its own. A notification that arrives without the
// reader asking for it needs role="status" — or role="alert" when the news is
// urgent — and the host knows which of the two it is.

import { defineComponent, h } from "vue";

/** The states the stylesheet paints. */
const VARIANTS = ["info", "success", "warning", "error"];

export const UMNotification = defineComponent({
  name: "UMNotification",
  example: "variants",
  props: {
    variant: { type: String, default: "info" },
    size: { type: String, default: "md" },
    title: { type: String, default: "" },
    closable: { type: Boolean, default: false },
    showClose: { type: Boolean, default: false },
  },
  setup(props, { slots }) {
    return () =>
      h(
        "div",
        {
          class: [
            "um-notification",
            VARIANTS.includes(props.variant) ? `um-notification--${props.variant}` : null,
            sizeClass(props.size),
          ],
        },
        [
          // The disc repeats what the heading already says, so it is hidden
          // from the reader.
          h("span", { class: "um-notification__icon", "aria-hidden": "true" }),
          h(
            "h3",
            { class: "um-notification__title" },
            slots.title ? slots.title({ title: props.title }) : props.title,
          ),
          h("div", { class: "um-notification__content" }, slots.default ? slots.default() : []),
          props.closable || props.showClose
            ? h("button", {
                class: "um-notification__close",
                type: "button",
                "aria-label": "Dismiss",
              })
            : null,
        ],
      );
  },
});

/** The medium card is the base class on its own. */
function sizeClass(size) {
  if (size === "sm") return "um-notification--sm";
  if (size === "lg") return "um-notification--lg";
  return null;
}
