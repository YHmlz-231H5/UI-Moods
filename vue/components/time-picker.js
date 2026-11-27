// ui-moods · Time Picker
//
// The field is a box with a real time input inside it, so the browser
// validates the hour, the arrow keys walk the segments and the reader's own
// clock opens it. The drawn clock beside the time is decoration: the browser's
// own indicator stays where the browser put it, because it is the only way to
// open the picker without JavaScript.
//
// The separator is a declared part, so it is in the markup either way — in a
// single field it is hidden, because a rule between one time and nothing is a
// line the reader can see. A range carries two inputs and the rule between
// them; the second time has no prop of its own, so it is the reader's to pick
// and the host's to write back.
//
// It answers to `v-model` as well as to `value`: a host that binds the field
// gets its own time back, and a host that writes `:value` gets exactly what
// it got before.

import { defineComponent, h, useId } from "vue";
import { modelValue, eventValue } from "../lib/model.mjs";

export const UMTimePicker = defineComponent({
  name: "UMTimePicker",
  example: "single",
  props: {
    value: { type: String, default: "" },
    min: { type: String, default: "" },
    max: { type: String, default: "" },
    step: { type: Number, default: 900 },
    required: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    readonly: { type: Boolean, default: false },
    type: { type: String, default: "single" },
    size: { type: String, default: "md" },
    modelValue: { type: String, default: undefined },
  },
  emits: ["change", "input", "update:modelValue"],
  setup(props, { slots, emit }) {
    // The field needs an id of its own, so two pickers on one page may not
    // share one.
    const fieldId = `um-time-picker-${useId()}`;

    return () => {
      const range = props.type === "range";

      /** A real time field; only the first one of a range carries the value. */
      const time = (id, name, value, ariaLabel) =>
        h("input", {
          class: "um-time-picker__input",
          type: "time",
          id,
          name,
          value,
          min: props.min || undefined,
          max: props.max || undefined,
          step: props.step,
          required: props.required,
          disabled: props.disabled,
          readonly: props.readonly,
          "aria-label": ariaLabel,
          onChange: (e) => {
            emit("update:modelValue", eventValue(e));
            emit("change", e);
          },
          onInput: (e) => emit("input", e),
        });

      return h(
        "div",
        {
          class: [
            "um-time-picker",
            range ? "um-time-picker--range" : null,
            props.size === "sm"
              ? "um-time-picker--sm"
              : props.size === "lg"
                ? "um-time-picker--lg"
                : null,
          ],
        },
        [
          h(
            "span",
            { class: "um-time-picker__icon", "aria-hidden": "true" },
            slots.icon ? slots.icon() : [],
          ),
          ...(range
            ? [time(`${fieldId}-from`, `${fieldId}-from`, modelValue(props, props.value) || undefined)]
            : [time(fieldId, fieldId, modelValue(props, props.value) || undefined)]),
          h("span", {
            class: "um-time-picker__separator",
            "aria-hidden": "true",
            hidden: !range,
          }),
          ...(range
            ? [time(undefined, `${fieldId}-to`, undefined, "End of the range")]
            : []),
        ],
      );
    };
  },
});
