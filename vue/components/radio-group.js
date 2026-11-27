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
//
// The group owns the selection when one is bound: `v-model` gives the group
// the value that is picked, and the options inside it ask the group which of
// them it is. The `value` and `checked` props keep their older meaning — the
// single option the group renders when the caller supplies no options of
// their own — so a host that used them gets exactly what it got before.

import { defineComponent, h } from "vue";
import { modelValue } from "../lib/model.mjs";
import { provideGroup, pickedValue } from "../lib/group.mjs";

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
    modelValue: { type: String, default: undefined },
    size: { type: String, default: "md" },
    type: { type: String, default: "radio" },
  },
  emits: ["change", "update:modelValue"],
  setup(props, { slots, emit }) {
    // The group publishes itself to the options inside it. The values are
    // getters, so an option that asks later gets the answer as it is now.
    provideGroup({
      kind: "radio",
      get value() {
        return modelValue(props, undefined);
      },
      get name() {
        return props.name;
      },
    });

    // The value that is picked, or `undefined` when the host did not bind one.
    const selected = () => modelValue(props, undefined);

    return () => {
      const rows = slots.default ? slots.default() : [];

      // The group's own option is the selected one when a value is bound and
      // names it; without a bound value the older `checked` prop decides.
      const ownChecked = () => {
        const bound = selected();
        return bound === undefined ? props.checked : bound === props.value;
      };

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
                    checked: ownChecked(),
                    disabled: props.disabled,
                    label: props.label,
                  })
                : [
                    h("input", {
                      type: "radio",
                      name: props.name || undefined,
                      value: props.value || undefined,
                      checked: ownChecked(),
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
            // The medium size is the base class itself, so it needs no
            // modifier — a class the stylesheet does not have paints nothing.
            props.size !== "md" ? `um-radio-group--${props.size}` : null,
            props.type === "button" ? "um-radio-group--button" : null,
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
              // caller's alike. The input that changed carries the value that
              // was picked, which is what the group publishes.
              onChange: (e) => {
                emit("update:modelValue", pickedValue(e));
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
