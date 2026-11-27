// ui-moods · Divider
//
// The divider draws its two rules with pseudo-elements, so the label in the
// middle is ordinary content — the default slot — and the vertical form
// needs a flex parent, which is the caller's layout to provide.

import { defineComponent, h } from "vue";

export const UMDivider = defineComponent({
  name: "UMDivider",
  example: "horizontal",
  props: {
    variant: { type: String, default: "" },
  },
  setup(props, { slots }) {
    return () =>
      h(
        "div",
        {
          class: ["um-divider", props.variant ? `um-divider--${props.variant}` : null],
          role: "separator",
          "aria-orientation": props.variant === "vertical" ? "vertical" : undefined,
        },
        slots.default ? slots.default() : [],
      );
  },
});
