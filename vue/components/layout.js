// ui-moods · Layout
//
// The parts are the landmarks: a header, an aside, a main and a footer. The
// wrapper keeps the order the page skeleton is read in — header, then the
// column and the content, then the footer — and the direction prop decides
// whether the column stands beside the content or above it.

import { defineComponent, h } from "vue";

export const UMLayout = defineComponent({
  name: "UMLayout",
  example: "horizontal",
  props: {
    direction: { type: String, default: "horizontal" },
    size: { type: String, default: "md" },
    align: { type: String, default: "stretch" },
  },
  setup(props, { slots }) {
    return () =>
      h(
        "div",
        {
          class: [
            "um-layout",
            props.direction === "stacked" ? "um-layout--stacked" : null,
            props.size !== "md" ? `um-layout--${props.size}` : null,
            // The stretched row is the base class on its own.
            props.align !== "stretch" ? `um-layout--align-${props.align}` : null,
          ],
        },
        [
          h("header", { class: "um-layout__header" }, slots.header ? slots.header() : []),
          h("div", { class: "um-layout__body" }, [
            h("aside", { class: "um-layout__aside" }, slots.aside ? slots.aside() : []),
            h("main", { class: "um-layout__main" }, slots.default ? slots.default() : []),
          ]),
          h("footer", { class: "um-layout__footer" }, slots.footer ? slots.footer() : []),
        ],
      );
  },
});
