// ui-moods · Switch
//
// The switch is a real checkbox inside a label, so the checked state is the
// browser's own and the setting submits with the form. The track and the
// thumb are two nested spans, and the thumb moves with a transform, so
// flipping the switch never moves anything around it.
//
// It answers to `v-model` as well as to `checked`: a host that binds the
// switch gets its own state back, and a host that writes `:checked` gets
// exactly what it got before.

import { defineComponent, h } from "vue";
import { modelValue, eventValue } from "../lib/model.mjs";

export const UMSwitch = defineComponent({
  name: "UMSwitch",
  example: "states",
  props: {
    checked: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    name: { type: String, default: "" },
    value: { type: String, default: "" },
    modelValue: { type: Boolean, default: undefined },
  },
  emits: ["change", "update:modelValue"],
  setup(props, { slots, emit }) {
    return () =>
      h("label", { class: "um-switch" }, [
        h("input", {
          class: "um-switch__input",
          type: "checkbox",
          checked: modelValue(props, props.checked),
          disabled: props.disabled,
          name: props.name || undefined,
          value: props.value || undefined,
          onChange: (e) => {
            emit("update:modelValue", eventValue(e, true));
            emit("change", e);
          },
        }),
        h("span", { class: "um-switch__track" }, [h("span", { class: "um-switch__thumb" })]),
        h("span", { class: "um-switch__label" }, slots.label ? slots.label() : []),
      ]);
  },
});
