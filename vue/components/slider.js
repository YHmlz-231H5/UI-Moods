// ui-moods · Slider
//
// A native range input: the browser owns the drag, the steps and the value, so
// the wrapper writes the bounds onto the element and forwards the two events
// the browser fires.
//
// It answers to `v-model` as well as to `value`: a host that binds the slider
// gets its own number back, and a host that writes `:value` gets exactly what
// it got before.

import { defineComponent, h } from "vue";
import { modelValue, eventValue } from "../lib/model.mjs";

export const UMSlider = defineComponent({
  name: "UMSlider",
  example: "range",
  props: {
    min: { type: Number, default: 0 },
    max: { type: Number, default: 100 },
    step: { type: Number, default: 1 },
    value: { type: Number },
    disabled: { type: Boolean, default: false },
    modelValue: { type: Number, default: undefined },
    vertical: { type: Boolean, default: false },
    size: { type: String, default: "md" },
    showStops: { type: Boolean, default: false },
  },
  emits: ["input", "change", "update:modelValue"],
  setup(props, { emit }) {
    return () =>
      h("input", {
        class: [
          "um-slider",
          props.vertical ? "um-slider--vertical" : null,
          // The middle size is the base class on its own, so it needs no
          // modifier — a class the stylesheet does not have paints nothing.
          props.size === "sm" ? "um-slider--sm" : props.size === "lg" ? "um-slider--lg" : null,
          props.showStops ? "um-slider--show-stops" : null,
        ],
        type: "range",
        min: props.min,
        max: props.max,
        step: props.step,
        value: modelValue(props, props.value),
        disabled: props.disabled,
        onInput: (e) => {
          emit("update:modelValue", Number(eventValue(e)));
          emit("input", e);
        },
        onChange: (e) => {
          emit("update:modelValue", Number(eventValue(e)));
          emit("change", e);
        },
      });
  },
});
