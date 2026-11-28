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
    size: { type: String, default: "md" },
    loading: { type: Boolean, default: false },
    inlinePrompt: { type: Boolean, default: false },
  },
  emits: ["change", "update:modelValue"],
  setup(props, { slots, emit }) {
    return () => {
      // The state the switch is in: the binding when the host bound one, the
      // `checked` prop when it did not.
      const on = modelValue(props, props.checked);

      // The inline prompt writes the state inside the track, so the word that
      // belongs to it is the one for the state the switch is in.
      const inner = on
        ? slots.active
          ? slots.active()
          : []
        : slots.inactive
          ? slots.inactive()
          : [];

      // The action is the mark beside the switch, and it is the one for the
      // state the switch is in too.
      const action = on
        ? slots["active-action"]
          ? slots["active-action"]()
          : []
        : slots["inactive-action"]
          ? slots["inactive-action"]()
          : [];

      return h(
        "label",
        {
          class: [
            "um-switch",
            // The medium size is the base class itself, so it needs no
            // modifier — a class the stylesheet does not have paints nothing.
            props.size !== "md" ? `um-switch--${props.size}` : null,
            props.loading ? "um-switch--loading" : null,
            props.inlinePrompt ? "um-switch--inline-prompt" : null,
          ],
        },
        [
          h("input", {
            class: "um-switch__input",
            type: "checkbox",
            checked: on,
            disabled: props.disabled,
            name: props.name || undefined,
            value: props.value || undefined,
            onChange: (e) => {
              emit("update:modelValue", eventValue(e, true));
              emit("change", e);
            },
          }),
          h("span", { class: "um-switch__track" }, [
            h("span", { class: "um-switch__thumb" }),
            h("span", { class: "um-switch__inner" }, inner),
          ]),
          h("span", { class: "um-switch__action" }, action),
          h("span", { class: "um-switch__label" }, slots.label ? slots.label() : []),
        ],
      );
    };
  },
});
