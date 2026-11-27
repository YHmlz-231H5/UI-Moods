// ui-moods · Steps
//
// A run of steps is a mix of states — one done, one running, the rest
// waiting — so the steps themselves are the default slot and keep the status
// classes they were written with. The wrapper owns the step the `status`
// prop describes: the one being worked on.
//
// The `active` prop says which step is being worked on, and the wrapper
// marks that one: it is the host's own step, so the mark is put on it rather
// than on a step the wrapper drew.

import { defineComponent, cloneVNode, h } from "vue";

export const UMSteps = defineComponent({
  name: "UMSteps",
  example: "horizontal",
  props: {
    direction: { type: String, default: "horizontal" },
    status: { type: String, default: "default" },
    processStatus: { type: String, default: "default" },
    active: { type: Number, default: 0 },
    alignCenter: { type: Boolean, default: false },
    simple: { type: Boolean, default: false },
  },
  setup(props, { slots }) {
    return () => {
      const steps = slots.default ? slots.default() : [];
      const marked = steps.map((step, i) =>
        props.active && i + 1 === props.active
          ? cloneVNode(step, { class: "um-steps__item--active" })
          : step,
      );
      // The step being worked on: `process-status` is Element Plus's name
      // for it and `status` is this library's, so either one of them says it.
      const standing = props.processStatus !== "default" ? props.processStatus : props.status;

      return h(
        "ol",
        {
          class: [
            "um-steps",
            props.direction === "vertical" ? "um-steps--vertical" : null,
            props.alignCenter ? "um-steps--align-center" : null,
            props.simple ? "um-steps--simple" : null,
          ],
        },
        [
          ...marked,
          h(
            "li",
            {
              class: [
                "um-steps__item",
                standing !== "default" ? `um-steps__item--${standing}` : null,
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
