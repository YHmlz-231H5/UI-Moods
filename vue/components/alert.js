// ui-moods · Alert
//
// An alert is four elements: the mark chip, the body, the title and the
// description. The manifest gives the component no slots, so the wrapper
// keeps every part and lets the caller fill them — a part that is never
// rendered is a part the stylesheet paints and nobody can use.

import { defineComponent, h } from "vue";

export const UMAlert = defineComponent({
  name: "UMAlert",
  example: "variants",
  props: {
    variant: { type: String, default: "primary" },
  },
  setup(props, { slots }) {
    return () =>
      h("div", { class: ["um-alert", `um-alert--${props.variant}`] }, [
        h("span", { class: "um-alert__mark" }, slots.mark ? slots.mark() : []),
        h("div", { class: "um-alert__body" }, [
          h("span", { class: "um-alert__title" }, slots.title ? slots.title() : []),
          h("span", { class: "um-alert__description" }, slots.default ? slots.default() : []),
        ]),
      ]);
  },
});
