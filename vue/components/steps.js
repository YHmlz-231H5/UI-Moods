// ui-moods · Steps
//
// A run of steps is a mix of states — one done, one running, the rest
// waiting — so the steps themselves are the default slot and keep the status
// classes they were written with. The wrapper owns the step the `status`
// prop describes: the one being worked on.

import { defineComponent, h } from "vue";

export const UMSteps = defineComponent({
  name: "UMSteps",
  example: "horizontal",
  props: {
    direction: { type: String, default: "horizontal" },
    status: { type: String, default: "default" },
  },
  setup(props, { slots }) {
    return () => {
      const steps = slots.default ? slots.default() : [];
      return h(
        "ol",
        {
          class: ["um-steps", props.direction === "vertical" ? "um-steps--vertical" : null],
        },
        [
          ...steps,
          h(
            "li",
            {
              class: [
                "um-steps__item",
                props.status !== "default" ? `um-steps__item--${props.status}` : null,
              ],
            },
            [
              h("span", { class: "um-steps__icon" }, slots.icon ? slots.icon() : []),
              h("span", { class: "um-steps__content" }, [
                h("span", { class: "um-steps__title" }, slots.title ? slots.title() : []),
                h(
                  "span",
                  { class: "um-steps__description" },
                  slots.description ? slots.description() : [],
                ),
              ]),
              h("span", { class: "um-steps__line", "aria-hidden": "true" }),
            ],
          ),
        ],
      );
    };
  },
});
