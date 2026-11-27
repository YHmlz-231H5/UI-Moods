// ui-moods · Backtop
//
// The button is a link to a fragment, so the wrapper's job is small: it
// points the link at the target, names it for the screen reader, and draws
// the arrow — a shape the stylesheet paints, not a glyph the host has to
// supply.

import { defineComponent, h } from "vue";

export const UMBacktop = defineComponent({
  name: "UMBacktop",
  example: "basic",
  props: {
    variant: { type: String, default: "solid" },
    size: { type: String, default: "md" },
    inline: { type: Boolean, default: false },
    target: { type: String, default: "#top" },
    label: { type: String, default: "Back to top" },
  },
  setup(props, { slots }) {
    return () =>
      h(
        "a",
        {
          class: [
            "um-backtop",
            props.variant === "soft" ? "um-backtop--soft" : null,
            props.size !== "md" ? `um-backtop--${props.size}` : null,
            props.inline ? "um-backtop--inline" : null,
          ],
          href: props.target,
          "aria-label": props.label,
        },
        // The arrow is a shape the stylesheet paints. A host that brings its
        // own mark puts it in the button instead.
        slots.default ? slots.default() : [h("span", { class: "um-backtop__icon", "aria-hidden": "true" })],
      );
  },
});
