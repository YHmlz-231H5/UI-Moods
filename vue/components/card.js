// ui-moods · Card
//
// Header, body and footer are optional on their own but the order is fixed,
// so the wrapper always renders all three and the caller fills them. The
// title is a real heading: the class sets the size, the element keeps the
// page's outline right.

import { defineComponent, h } from "vue";

export const UMCard = defineComponent({
  name: "UMCard",
  example: "card",
  props: {
    variant: { type: String, default: "" },
  },
  setup(props, { slots }) {
    return () =>
      h("div", { class: ["um-card", props.variant ? `um-card--${props.variant}` : null] }, [
        h("div", { class: "um-card__header" }, [
          h("h3", { class: "um-card__title" }, slots.title ? slots.title() : []),
          ...(slots.header ? slots.header() : []),
        ]),
        h("div", { class: "um-card__body" }, slots.default ? slots.default() : []),
        h("div", { class: "um-card__footer" }, slots.footer ? slots.footer() : []),
      ]);
  },
});
