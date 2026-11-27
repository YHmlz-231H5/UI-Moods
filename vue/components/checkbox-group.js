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
//
// The group owns the selection when one is bound: `v-model` gives the group
// the list of values that are ticked, and the options inside it ask the group
// whether they are among them. The `value` and `checked` props keep their
// older meaning — the single option the group renders when the caller
// supplies no options of their own — so a host that used them gets exactly
// what it got before.

import { defineComponent, h } from "vue";
import { modelValue } from "../lib/model.mjs";
import { provideGroup, tickedValues } from "../lib/group.mjs";

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
    modelValue: { type: Array, default: undefined },
  },
  emits: ["change", "update:modelValue"],
  setup(props, { slots, emit }) {
    // The values that are ticked, or an empty list when the host did not bind
    // one.
    const ticked = () => modelValue(props, []) ?? [];

    // The group publishes itself to the options inside it. The values are
    // getters, so an option that asks later gets the answer as it is now.
    provideGroup({
      kind: "checkbox",
      get value() {
        return ticked();
      },
      get name() {
        return props.name;
      },
    });

    return () => {
      const rows = slots.default ? slots.default() : [];

      // The group's own option is ticked when a bound list names its value;
      // without a bound list the older `checked` prop decides.
      const ownChecked = () => {
        const bound = modelValue(props, undefined);
        return bound === undefined ? props.checked : bound.includes(props.value);
      };

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
                    checked: ownChecked(),
                    disabled: props.disabled,
                    label: props.label,
                  })
                : [
                    h("input", {
                      type: "checkbox",
                      name: props.name || undefined,
                      value: props.value || undefined,
                      checked: ownChecked(),
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
              // caller's alike. The input that changed carries both its value
              // and whether it is now ticked, which is what the list is built
              // from.
              onChange: (e) => {
                emit("update:modelValue", tickedValues(ticked(), e));
                emit("change", e);
              },
            },
            options,
          ),
        ],
      );
    };
  },
});
