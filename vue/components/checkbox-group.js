// ui-moods · Checkbox Group
//
// The group is a fieldset with a legend, and the options inside it are real
// inputs, so the browser keeps the group a group and the ticked values submit
// with the form. The box drawn inside an option belongs to the checkbox
// component rather than to the group, so the group never paints it — the
// caller's own markup goes in through the default slot, and the option slot
// is the template for the single option the group's own props describe.
//
// The wrapper keeps the fieldset, the legend and the panel the options sit
// in; the options themselves are the caller's, so a group can hold as many of
// them as the form needs.

import { defineComponent, h } from "vue";

export const UMCheckboxGroup = defineComponent({
  name: "UMCheckboxGroup",
  example: "stacked",
  props: {
    name: { type: String, default: "" },
    value: { type: String, default: "" },
    checked: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    direction: { type: String, default: "stacked" },
    label: { type: String, default: "" },
  },
  emits: ["change"],
  setup(props, { slots, emit }) {
    return () => {
      const rows = slots.default ? slots.default() : [];

      const options = rows.length
        ? rows
        : [
            h(
              "label",
              { class: "um-checkbox-group__option" },
              slots.option
                ? slots.option({
                    index: 0,
                    name: props.name,
                    value: props.value,
                    checked: props.checked,
                    disabled: props.disabled,
                    label: props.label,
                  })
                : [
                    h("input", {
                      type: "checkbox",
                      name: props.name || undefined,
                      value: props.value || undefined,
                      checked: props.checked,
                      disabled: props.disabled,
                    }),
                    // The group owns no text of its own, so an option that was
                    // not given one shows what it submits.
                    h("span", { class: "um-checkbox-group__label" }, props.value),
                  ],
            ),
          ];

      return h(
        "fieldset",
        {
          class: [
            "um-checkbox-group",
            props.direction === "inline" ? "um-checkbox-group--inline" : null,
          ],
        },
        [
          h(
            "legend",
            { class: "um-checkbox-group__legend" },
            slots.legend ? slots.legend() : props.label,
          ),
          h(
            "div",
            {
              class: "um-checkbox-group__options",
              // The change event bubbles out of the input, so the handler sits
              // on the panel: it fires for the wrapper's own input and for the
              // caller's alike.
              onChange: (e) => emit("change", e),
            },
            options,
          ),
        ],
      );
    };
  },
});
