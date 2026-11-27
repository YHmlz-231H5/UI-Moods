// ui-moods · Date Picker
//
// The field is a box with a real date input inside it, so the browser
// validates the date, the arrow keys walk through it and the reader's own
// calendar opens it. The drawn glyph beside the date is decoration: the
// browser's own indicator stays where the browser put it, because it is the
// only way to open the picker without JavaScript.
//
// The separator is a declared part, so it is in the markup either way — in a
// single field it is hidden, because a rule between one date and nothing is a
// line the reader can see. A range carries two inputs and the rule between
// them; the second date has no prop of its own, so it is the reader's to
// pick and the host's to write back.

import { defineComponent, h, useId } from "vue";

export const UMDatePicker = defineComponent({
  name: "UMDatePicker",
  example: "single",
  props: {
    value: { type: String, default: "" },
    min: { type: String, default: "" },
    max: { type: String, default: "" },
    required: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    type: { type: String, default: "single" },
    size: { type: String, default: "md" },
  },
  emits: ["change", "input"],
  setup(props, { slots, emit }) {
    // The field needs an id of its own, so two pickers on one page may not
    // share one.
    const fieldId = `um-date-picker-${useId()}`;

    return () => {
      const range = props.type === "range";

      /** A real date field; only the first one of a range carries the value. */
      const date = (id, name, value, ariaLabel) =>
        h("input", {
          class: "um-date-picker__input",
          type: "date",
          id,
          name,
          value,
          min: props.min || undefined,
          max: props.max || undefined,
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
            "um-date-picker",
            range ? "um-date-picker--range" : null,
            props.size === "sm"
              ? "um-date-picker--sm"
              : props.size === "lg"
                ? "um-date-picker--lg"
                : null,
          ],
        },
        [
          h(
            "span",
            { class: "um-date-picker__icon", "aria-hidden": "true" },
            slots.icon ? slots.icon() : [],
          ),
          ...(range
            ? [date(`${fieldId}-from`, `${fieldId}-from`, props.value || undefined)]
            : [date(fieldId, fieldId, props.value || undefined)]),
          h("span", {
            class: "um-date-picker__separator",
            "aria-hidden": "true",
            hidden: !range,
          }),
          ...(range ? [date(undefined, `${fieldId}-to`, undefined, "End of the range")] : []),
        ],
      );
    };
  },
});
