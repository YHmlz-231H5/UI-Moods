// ui-moods · Collapse
//
// A panel is a disclosure, not a menu: the browser owns the open state, so the
// panel stays open across a reload and the reader gets the collapsed and
// expanded announcement for free. The open prop is the native open attribute
// on the details, and the toggle event is the browser's own.
//
// The wrapper draws one panel — the header, its title, the mark that says the
// panel opens and the body — and the default slot is where the body goes.

import { defineComponent, h } from "vue";

export const UMCollapse = defineComponent({
  name: "UMCollapse",
  example: "plain",
  props: {
    open: { type: Boolean, default: false },
    variant: { type: String, default: "plain" },
    size: { type: String, default: "md" },
    title: { type: String, default: "" },
  },
  emits: ["toggle"],
  setup(props, { slots, emit }) {
    return () =>
      h(
        "details",
        {
          class: [
            "um-collapse",
            props.variant === "card"
              ? "um-collapse--card"
              : props.variant === "plain"
                ? "um-collapse--plain"
                : null,
            props.size === "sm"
              ? "um-collapse--sm"
              : props.size === "lg"
                ? "um-collapse--lg"
                : null,
          ],
          open: props.open,
          onToggle: (e) => emit("toggle", e),
        },
        [
          h(
            "summary",
            { class: "um-collapse__header" },
            slots.header
              ? slots.header({ title: props.title, open: props.open })
              : [
                  h("span", { class: "um-collapse__title" }, props.title),
                  h("span", { class: "um-collapse__arrow", "aria-hidden": "true" }),
                ],
          ),
          h(
            "div",
            { class: "um-collapse__content" },
            slots.default ? slots.default({ open: props.open }) : [],
          ),
        ],
      );
  },
});
