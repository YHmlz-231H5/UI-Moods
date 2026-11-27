// ui-moods · Badge
//
// The neutral badge is the base class on its own, so the variant stays empty
// until the caller asks for a colour and the wrapper paints a modifier class
// only when there is one to paint.

import { defineComponent, h } from "vue";

export const UMBadge = defineComponent({
  name: "UMBadge",
  example: "variants",
  props: {
    variant: { type: String, default: "" },
    dot: { type: Boolean, default: false },
  },
  setup(props, { slots }) {
    return () =>
      h(
        "span",
        { class: ["um-badge", props.variant ? `um-badge--${props.variant}` : null] },
        [
          ...(props.dot ? [h("span", { class: "um-badge__dot" })] : []),
          ...(slots.default ? slots.default() : []),
        ],
      );
  },
});
