// ui-moods · Card
//
// Header, body and footer are optional on their own but the order is fixed,
// so the wrapper always renders all three and the caller fills them. The
// title is a real heading: the class sets the size, the element keeps the
// page's outline right.
//
// The header prop is the title, the header slot is what stands in the strip
// beside it, and the footer prop is the footer's text while the footer slot
// is what the footer holds. They are four different things and the library
// keeps them apart.

import { defineComponent, h } from "vue";

export const UMCard = defineComponent({
  name: "UMCard",
  example: "card",
  props: {
    variant: { type: String, default: "" },
    header: { type: String, default: "" },
    footer: { type: String, default: "" },
    shadow: { type: String, default: "always" },
  },
  setup(props, { slots }) {
    return () =>
      h(
        "div",
        {
          class: [
            "um-card",
            props.variant ? `um-card--${props.variant}` : null,
            // The always run is the base class; the modifier would only
            // repeat it.
            props.shadow === "never"
              ? "um-card--shadow-never"
              : props.shadow === "hover"
                ? "um-card--shadow-hover"
                : null,
          ],
        },
        [
          h("div", { class: "um-card__header" }, [
            h("h3", { class: "um-card__title" }, slots.title ? slots.title() : props.header),
            ...(slots.header ? slots.header() : []),
          ]),
          h("div", { class: "um-card__body" }, slots.default ? slots.default() : []),
          h("div", { class: "um-card__footer" }, slots.footer ? slots.footer() : props.footer),
        ],
      );
  },
});
