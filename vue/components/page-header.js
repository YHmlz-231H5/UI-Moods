// ui-moods · PageHeader
//
// The header is a band, and the wrapper builds it out of three things: the
// heading and its line on one side, the actions on the other. The heading's
// level is a prop rather than a constant, because the class sets the size
// and the page — not the component — knows where in the outline it sits.

import { defineComponent, h } from "vue";

export const UMPageHeader = defineComponent({
  name: "UMPageHeader",
  example: "basic",
  props: {
    title: { type: String, default: "" },
    subtitle: { type: String, default: "" },
    level: { type: String, default: "1" },
    variant: { type: String, default: "plain" },
  },
  setup(props, { slots }) {
    return () =>
      h(
        "header",
        {
          class: [
            "um-page-header",
            props.variant === "bordered" ? "um-page-header--bordered" : null,
          ],
        },
        [
          h("div", { class: "um-page-header__content" }, [
            h(
              `h${props.level}`,
              { class: "um-page-header__title" },
              slots.title ? slots.title() : props.title,
            ),
            h(
              "p",
              { class: "um-page-header__subtitle" },
              slots.subtitle ? slots.subtitle() : props.subtitle,
            ),
          ]),
          h("div", { class: "um-page-header__actions" }, slots.actions ? slots.actions() : []),
        ],
      );
  },
});
