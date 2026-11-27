// ui-moods · Tag
//
// The neutral tag is the base class on its own, so the variant stays empty
// until the caller asks for a colour.

import { defineComponent, h } from "vue";

export const UMTag = defineComponent({
  name: "UMTag",
  example: "variants",
  props: {
    variant: { type: String, default: "" },
  },
  setup(props, { slots }) {
    return () =>
      h(
        "span",
        { class: ["um-tag", props.variant ? `um-tag--${props.variant}` : null] },
        slots.default ? slots.default() : [],
      );
  },
});
