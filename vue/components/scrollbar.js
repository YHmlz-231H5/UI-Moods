// ui-moods · Scrollbar
//
// The wrap is the element that scrolls and the view is the content inside it.
// The height is the caller's to give: a box that is not given one never
// scrolls, because its content is what gives it one, so the wrapper does not
// guess a number either.

import { defineComponent, h } from "vue";

export const UMScrollbar = defineComponent({
  name: "UMScrollbar",
  example: "solid",
  props: {
    variant: { type: String, default: "solid" },
    size: { type: String, default: "md" },
    height: { type: String, default: "" },
  },
  setup(props, { slots }) {
    return () =>
      h("div", {
        class: [
          "um-scrollbar",
          `um-scrollbar--${props.variant}`,
          // The medium size is the base class itself, so it needs no
          // modifier — a class the stylesheet does not have paints nothing.
          props.size !== "md" ? `um-scrollbar--${props.size}` : null,
        ],
      }, [
        h(
          "div",
          {
            class: "um-scrollbar__wrap",
            tabindex: "0",
            style: props.height ? { height: props.height } : undefined,
          },
          [h("div", { class: "um-scrollbar__view" }, slots.default ? slots.default() : [])],
        ),
      ]);
  },
});
