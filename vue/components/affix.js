// ui-moods · Affix
//
// The affix is a positioning context and the bar is the surface, so the
// wrapper keeps the two apart: the outer element is what `position: sticky`
// holds, the inner one is what the reader sees. The content goes in the bar.

import { defineComponent, h } from "vue";

export const UMAffix = defineComponent({
  name: "UMAffix",
  example: "top",
  props: {
    position: { type: String, default: "top" },
  },
  setup(props, { slots }) {
    return () =>
      h(
        "div",
        {
          class: ["um-affix", props.position === "bottom" ? "um-affix--bottom" : null],
        },
        [h("div", { class: "um-affix__bar" }, slots.default ? slots.default() : [])],
      );
  },
});
