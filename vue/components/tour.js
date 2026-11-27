// ui-moods · Tour
//
// The root is the thing the walkthrough points at and the card hangs off it,
// so the caller's content is the target and the card is built around it. The
// dots are one per step with the current one filled in: which step that is,
// and what the walkthrough does next, is the host's to drive — the library
// has no script to move it with.

import { defineComponent, h } from "vue";

export const UMTour = defineComponent({
  name: "UMTour",
  example: "bottom",
  props: {
    placement: { type: String, default: "bottom" },
    size: { type: String, default: "md" },
    title: { type: String, default: "" },
    content: { type: String, default: "" },
    step: { type: Number, default: 1 },
    total: { type: Number, default: 3 },
  },
  setup(props, { slots }) {
    return () => {
      const count = Math.max(props.total, 0);
      const dots = Array.from({ length: count }, (_, index) =>
        h("span", {
          class:
            index + 1 === props.step
              ? "um-tour__dot um-tour__dot--active"
              : "um-tour__dot",
        }),
      );

      return h(
        "div",
        {
          class: [
            "um-tour",
            `um-tour--${props.placement}`,
            // The medium size is the base class itself, so it needs no
            // modifier — a class the stylesheet does not have paints nothing.
            props.size !== "md" ? `um-tour--${props.size}` : null,
          ],
          role: "group",
        },
        [
          // The thing the walkthrough points at. The ring is drawn around it.
          slots.default ? slots.default() : [],
          h("div", { class: "um-tour__panel" }, [
            h("span", { class: "um-tour__arrow", "aria-hidden": "true" }),
            h("p", { class: "um-tour__title" }, slots.title ? slots.title() : props.title),
            h(
              "p",
              { class: "um-tour__content" },
              slots.content ? slots.content() : props.content,
            ),
            h("div", { class: "um-tour__footer" }, [
              h("div", { class: "um-tour__dots", "aria-label": `Step ${props.step} of ${count}` }, dots),
              h(
                "button",
                { class: "um-tour__action", type: "button" },
                slots.action ? slots.action() : "Next",
              ),
            ]),
          ]),
        ],
      );
    };
  },
});
