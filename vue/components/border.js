// ui-moods · Border
//
// The frame paints the surface, so the content goes into the body part and
// paints nothing itself: two layers of fill would be a colour no role names.

import { defineComponent, h } from "vue";

export const UMBorder = defineComponent({
  name: "UMBorder",
  example: "variants",
  props: {
    variant: { type: String, default: "primary" },
    size: { type: String, default: "md" },
  },
  setup(props, { slots }) {
    return () =>
      h(
        "div",
        {
          class: [
            "um-border",
            `um-border--${props.variant}`,
            props.size !== "md" ? `um-border--${props.size}` : null,
          ],
        },
        [h("div", { class: "um-border__body" }, slots.default ? slots.default() : [])],
      );
  },
});
