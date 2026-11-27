// ui-moods · Slider
//
// A native range input: the browser owns the drag, the steps and the value, so
// the wrapper writes the bounds onto the element and forwards the two events
// the browser fires.

import { defineComponent, h } from "vue";

export const UMSlider = defineComponent({
  name: "UMSlider",
  example: "range",
  props: {
    min: { type: Number, default: 0 },
    max: { type: Number, default: 100 },
    step: { type: Number, default: 1 },
    value: { type: Number },
    disabled: { type: Boolean, default: false },
  },
  emits: ["input", "change"],
  setup(props, { emit }) {
    return () =>
      h("input", {
        class: "um-slider",
        type: "range",
        min: props.min,
        max: props.max,
        step: props.step,
        value: props.value,
        disabled: props.disabled,
        onInput: (e) => emit("input", e),
        onChange: (e) => emit("change", e),
      });
  },
});
