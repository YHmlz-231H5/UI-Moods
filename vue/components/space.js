// ui-moods · Space
//
// The space is one gap on the container, so the wrapper's job is to put every
// child into an item and let the container do the spacing. It adds no size of
// its own and paints no surface: the items are the caller's content, and what
// they sit on is still whatever the page put there.

import { defineComponent, h } from "vue";

export const UMSpace = defineComponent({
  name: "UMSpace",
  example: "horizontal",
  props: {
    direction: { type: String, default: "horizontal" },
    size: { type: String, default: "md" },
    wrap: { type: Boolean, default: true },
    fill: { type: Boolean, default: false },
  },
  setup(props, { slots }) {
    return () => {
      const items = slots.default ? slots.default() : [];
      // A run with nothing in it still has one item in it, so the component
      // has a shape of its own before the caller fills it.
      const rows = items.length
        ? items.map((item) => h("div", { class: "um-space__item" }, [item]))
        : [h("div", { class: "um-space__item" })];

      return h(
        "div",
        {
          class: [
            "um-space",
            `um-space--${props.direction}`,
            // The medium size is the base class itself, so it needs no
            // modifier — a class the stylesheet does not have paints nothing.
            props.size !== "md" ? `um-space--${props.size}` : null,
            // The run wraps unless it is told not to, so the class says what
            // it does to the run rather than what the run does.
            props.wrap ? null : "um-space--no-wrap",
            props.fill ? "um-space--fill" : null,
          ],
        },
        rows,
      );
    };
  },
});
