// ui-moods · Date Time Picker
//
// The field is a box with a real date-time input inside it, so the browser
// validates both halves, the arrow keys walk the segments and the reader's
// own calendar opens it. The browser's indicator is left where the browser
// put it: it is the only way to open the picker without JavaScript, and a
// field that holds both a date and a time has no single drawn mark to stand
// for it.
//
// The separator is a declared part, so it is in the markup either way — in a
// single field it is hidden, because a rule between one value and nothing is a
// line the reader can see. A range carries two inputs and the rule between
// them; the second date-time has no prop of its own, so it is the reader's to
// pick and the host's to write back.
//
// It answers to `v-model` as well as to `value`: a host that binds the field
// gets its own date-time back, and a host that writes `:value` gets exactly
// what it got before.

import { defineComponent, h, useId } from "vue";
import { modelValue, eventValue } from "../lib/model.mjs";

export const UMDateTimePicker = defineComponent({
  name: "UMDateTimePicker",
  example: "single",
  props: {
    value: { type: String, default: "" },
    min: { type: String, default: "" },
    max: { type: String, default: "" },
    step: { type: Number, default: 60 },
    required: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    readonly: { type: Boolean, default: false },
    type: { type: String, default: "single" },
    size: { type: String, default: "md" },
    modelValue: { type: String, default: undefined },
    editable: { type: Boolean, default: true },
    placeholder: { type: String, default: "" },
  },
  emits: ["change", "input", "update:modelValue"],
  setup(props, { slots, emit, attrs }) {
    // The field needs an id of its own, so two pickers on one page may not
    // share one.
    const fieldId = `um-date-time-picker-${useId()}`;
    // The name of the field is an attribute rather than a prop: it is not a
    // visual parameter of the control, and a host that needs a Chinese name
    // should be able to give one.
    const label = attrs["aria-label"];

    return () => {
      const range = props.type === "range";
      // The mark between the two moments of a range. The host's own mark,
      // when it brings one; the rule the stylesheet draws, when it does not.
      const separator = slots["range-separator"] ? slots["range-separator"]() : [];

      /** A real date-time field; only the first one of a range carries the value. */
      const moment = (id, name, value, ariaLabel) =>
        h("input", {
          class: "um-date-time-picker__input",
          type: "datetime-local",
          id,
          name,
          value,
          min: props.min || undefined,
          max: props.max || undefined,
          step: props.step,
          required: props.required,
          disabled: props.disabled,
          // `editable` is Element Plus's name for the same thing and
          // `readonly` is this library's: either one of them says it.
          readonly: props.readonly || !props.editable,
          placeholder: props.placeholder || undefined,
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
            "um-date-time-picker",
            range ? "um-date-time-picker--range" : null,
            props.size === "sm"
              ? "um-date-time-picker--sm"
              : props.size === "lg"
                ? "um-date-time-picker--lg"
                : null,
          ],
        },
        [
          ...(range
            ? [
                moment(
                  `${fieldId}-from`,
                  `${fieldId}-from`,
                  modelValue(props, props.value) || undefined,
                  label || "Start of the range",
                ),
              ]
            : [
                moment(
                  fieldId,
                  fieldId,
                  modelValue(props, props.value) || undefined,
                  label || "Date and time",
                ),
              ]),
          h("span", {
            class: "um-date-time-picker__separator",
            // The rule is decoration; a mark the host brought is not.
            "aria-hidden": separator.length ? undefined : "true",
            hidden: !range,
          }, separator),
          ...(range
            ? [moment(undefined, `${fieldId}-to`, undefined, "End of the range")]
            : []),
        ],
      );
    };
  },
});
