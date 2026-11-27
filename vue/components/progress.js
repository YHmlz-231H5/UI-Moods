// ui-moods · Progress
//
// The width of the fill is data, not a class, so it goes in the inline style
// of the bar — the one place the manifest allows a number to live. The ARIA
// values sit on the container, because the painted bar carries no value of
// its own.
//
// The indeterminate run has no value to write at all, so the bar carries no
// width and the stylesheet moves it along the track instead.

import { defineComponent, h } from "vue";

/** The tones the fill can take; without one it is the brand colour. */
const VARIANTS = ["success", "warning", "danger"];

export const UMProgress = defineComponent({
  name: "UMProgress",
  example: "variants",
  props: {
    variant: { type: String, default: "" },
    value: { type: Number, default: 0 },
    label: { type: String, default: "" },
    status: { type: String, default: "" },
    indeterminate: { type: Boolean, default: false },
    showText: { type: Boolean, default: false },
    striped: { type: Boolean, default: false },
    stripedFlow: { type: Boolean, default: false },
  },
  setup(props, { slots }) {
    return () => {
      // The status prop is the short way of naming the tone; the variant is
      // the fallback when it is left out.
      const tone = props.status || props.variant;
      const label = slots.label
        ? slots.label()
        : props.label || (props.showText ? `${props.value}%` : "");

      return h(
        "div",
        {
          class: [
            "um-progress",
            VARIANTS.includes(tone) ? `um-progress--${tone}` : null,
            props.indeterminate ? "um-progress--indeterminate" : null,
            props.showText ? "um-progress--show-text" : null,
            // The flowing run is a striped run that moves.
            props.striped || props.stripedFlow ? "um-progress--striped" : null,
            props.stripedFlow ? "um-progress--striped-flow" : null,
          ],
          role: "progressbar",
          // A bar that does not know how much is done has no value to report.
          "aria-valuenow": props.indeterminate ? undefined : props.value,
          "aria-valuemin": 0,
          "aria-valuemax": 100,
        },
        [
          h("div", { class: "um-progress__track" }, [
            h(
              "div",
              {
                class: "um-progress__bar",
                style: props.indeterminate ? null : { width: `${props.value}%` },
              },
              slots.default ? slots.default() : [],
            ),
          ]),
          h("span", { class: "um-progress__label" }, label),
        ],
      );
    };
  },
});
