// ui-moods · Radio Group
//
// The group is a fieldset with a legend, and the options inside it are real
// radios, so the browser keeps exactly one of them picked and the name is
// what makes them a group. The circle drawn inside an option belongs to the
// radio component rather than to the group, so the group never paints it —
// the caller's own markup goes in through the default slot, and the option
// slot is the template for the single option the group's own props describe.
//
// The wrapper keeps the fieldset, the legend and the panel the options sit
// in; the options themselves are the caller's, so a group can hold as many of
// them as the form needs.

import { defineComponent, h } from "vue";

export const UMRadioGroup = defineComponent({
  name: "UMRadioGroup",
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
              { class: "um-radio-group__option" },
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
                      type: "radio",
                      name: props.name || undefined,
                      value: props.value || undefined,
                      checked: props.checked,
                      disabled: props.disabled,
                    }),
                    // The group owns no text of its own, so an option that was
                    // not given one shows what it submits.
                    h("span", { class: "um-radio-group__label" }, props.value),
                  ],
            ),
          ];

      return h(
        "fieldset",
        {
          class: [
            "um-radio-group",
            props.direction === "inline" ? "um-radio-group--inline" : null,
          ],
        },
        [
          h(
            "legend",
            { class: "um-radio-group__legend" },
            slots.legend ? slots.legend() : props.label,
          ),
          h(
            "div",
            {
              class: "um-radio-group__options",
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
