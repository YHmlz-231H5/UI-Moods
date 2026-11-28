// ui-moods · Loading
//
// The three shapes are three arrangements of the same two pieces: a ring and
// a caption. The overlay puts them on a panel over the page, so the panel is
// a part of its own — and where the overlay is not asked for, the panel is
// taken out of the flow rather than left as an empty card around the ring.

import { defineComponent, h } from "vue";

/** The three shapes the ring and the caption are arranged in. */
const VARIANTS = ["spinner", "text", "overlay"];

/** The sizes the ring takes; the medium one is the base class. */
const SIZES = ["small", "large"];

export const UMLoading = defineComponent({
  name: "UMLoading",
  example: "spinner",
  props: {
    variant: { type: String, default: "spinner" },
    size: { type: String, default: "medium" },
    text: { type: String, default: "" },
    closed: { type: Boolean, default: false },
    fullscreen: { type: Boolean, default: false },
    lock: { type: Boolean, default: false },
  },
  setup(props, { slots }) {
    return () => {
      const caption = slots.text ? slots.text({ text: props.text }) : props.text;
      const ring = h("span", { class: "um-loading__spinner", "aria-hidden": "true" });
      const label = h("span", { class: "um-loading__text", hidden: !hasContent(caption) }, caption);
      const overlay = props.variant === "overlay";

      return h(
        "div",
        {
          class: [
            "um-loading",
            VARIANTS.includes(props.variant) ? `um-loading--${props.variant}` : null,
            SIZES.includes(props.size) ? `um-loading--${props.size}` : null,
            props.closed ? "um-loading--closed" : null,
            props.fullscreen ? "um-loading--fullscreen" : null,
            props.lock ? "um-loading--lock" : null,
          ],
          // The caption is the message, so the wrapper announces it where
          // the caption is there to be announced.
          role: props.variant === "spinner" ? null : "status",
        },
        overlay
          ? [h("div", { class: "um-loading__panel" }, [ring, label])]
          : [
              ring,
              label,
              h("div", {
                class: "um-loading__panel",
                // The stylesheet draws the panel as a flex box with a surface
                // of its own, so the hidden attribute would not take it out
                // of the flow.
                style: { display: "none" },
              }),
            ],
      );
    };
  },
});

/** Whether a slot or a prop carries anything at all. */
function hasContent(content) {
  if (typeof content === "string") return content !== "";
  if (Array.isArray(content)) return content.length > 0;
  return Boolean(content);
}
