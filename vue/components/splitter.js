// ui-moods · Splitter
//
// The splitter draws the shape: two panes, a divider and a grip. It does not
// move the divider — there is no JavaScript in the library, so the size of
// the two panes is fixed by the markup, and a host that drags it has to set
// the separator's value for itself.

import { defineComponent, h } from "vue";

export const UMSplitter = defineComponent({
  name: "UMSplitter",
  example: "horizontal",
  props: {
    layout: { type: String, default: "horizontal" },
    size: { type: String, default: "md" },
  },
  setup(props, { slots }) {
    return () =>
      h("div", {
        class: [
          "um-splitter",
          `um-splitter--${props.layout}`,
          // The medium size is the base class itself, so it needs no
          // modifier — a class the stylesheet does not have paints nothing.
          props.size !== "md" ? `um-splitter--${props.size}` : null,
        ],
      }, [
        h("div", { class: "um-splitter__panel" }, slots.start ? slots.start() : []),
        h(
          "div",
          {
            class: "um-splitter__bar",
            role: "separator",
            "aria-orientation": props.layout === "vertical" ? "horizontal" : "vertical",
            tabindex: "0",
          },
          [h("span", { class: "um-splitter__handle", "aria-hidden": "true" })],
        ),
        h("div", { class: "um-splitter__panel" }, slots.end ? slots.end() : []),
      ]);
  },
});
