// ui-moods · Progress
//
// The width of the fill is data, not a class, so it goes in the inline style
// of the bar — the one place the manifest allows a number to live. The ARIA
// values sit on the container, because the painted bar carries no value of
// its own.

import { defineComponent, h } from "vue";

export const UMProgress = defineComponent({
  name: "UMProgress",
  example: "variants",
  props: {
    variant: { type: String, default: "" },
    value: { type: Number, default: 0 },
    label: { type: String, default: "" },
  },
  setup(props, { slots }) {
    return () =>
      h(
        "div",
        {
          class: ["um-progress", props.variant ? `um-progress--${props.variant}` : null],
          role: "progressbar",
          "aria-valuenow": props.value,
          "aria-valuemin": 0,
          "aria-valuemax": 100,
        },
        [
          h("div", { class: "um-progress__track" }, [
            h("div", { class: "um-progress__bar", style: { width: `${props.value}%` } }),
          ]),
          h(
            "span",
            { class: "um-progress__label" },
            slots.label ? slots.label() : props.label,
          ),
        ],
      );
  },
});
