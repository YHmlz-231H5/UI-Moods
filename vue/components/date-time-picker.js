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

import { defineComponent, h, useId } from "vue";

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
    type: { type: String, default: "single" },
    size: { type: String, default: "md" },
  },
  emits: ["change", "input"],
  setup(props, { emit }) {
    // The field needs an id of its own, so two pickers on one page may not
    // share one.
    const fieldId = `um-date-time-picker-${useId()}`;

    return () => {
      const range = props.type === "range";

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
          "aria-label": ariaLabel,
          onChange: (e) => emit("change", e),
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
            ? [moment(`${fieldId}-from`, `${fieldId}-from`, props.value || undefined)]
            : [moment(fieldId, fieldId, props.value || undefined)]),
          h("span", {
            class: "um-date-time-picker__separator",
            "aria-hidden": "true",
            hidden: !range,
          }),
          ...(range
            ? [moment(undefined, `${fieldId}-to`, undefined, "End of the range")]
            : []),
        ],
      );
    };
  },
});
