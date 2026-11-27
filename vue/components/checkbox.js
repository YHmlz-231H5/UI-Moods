// ui-moods · Checkbox
//
// The box is a real input inside a label and the drawn parts are spans, so the
// state is the browser's own `:checked` and the value submits with the form.
// The dash is the one state the markup cannot reach: `indeterminate` is a
// property of the element rather than an attribute, so it is set on mount.
//
// It answers to `v-model` as well as to `checked`. Inside a checkbox group the
// group owns the selection — the group says which values are ticked — so a box
// in a group asks the group rather than its own prop.

import { defineComponent, h, onMounted, ref, watch } from "vue";
import { modelValue, eventValue } from "../lib/model.mjs";
import { useGroup, isSelected } from "../lib/group.mjs";

export const UMCheckbox = defineComponent({
  name: "UMCheckbox",
  example: "states",
  props: {
    checked: { type: Boolean, default: false },
    indeterminate: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    name: { type: String, default: "" },
    value: { type: String, default: "" },
    modelValue: { type: Boolean, default: undefined },
    border: { type: Boolean, default: false },
    size: { type: String, default: "md" },
  },
  emits: ["change", "update:modelValue"],
  setup(props, { slots, emit }) {
    const input = ref(null);
    const group = useGroup();

    const applyIndeterminate = () => {
      if (input.value) input.value.indeterminate = props.indeterminate;
    };
    onMounted(applyIndeterminate);
    watch(() => props.indeterminate, applyIndeterminate);

    // A box in a group is ticked when the group says its value is one of the
    // ticked ones; a box on its own answers to its own prop.
    const isChecked = () =>
      group ? isSelected(group, props.value) : modelValue(props, props.checked);

    return () =>
      h(
        "label",
        {
          class: [
            "um-checkbox",
            // The medium size is the base class itself, so it needs no
            // modifier — a class the stylesheet does not have paints nothing.
            props.size !== "md" ? `um-checkbox--${props.size}` : null,
            props.border ? "um-checkbox--border" : null,
          ],
        },
        [
          h("input", {
            ref: input,
            class: "um-checkbox__input",
            type: "checkbox",
            checked: isChecked(),
            disabled: props.disabled,
            name: props.name || group?.name || undefined,
            value: props.value || undefined,
            onChange: (e) => {
              emit("update:modelValue", eventValue(e, true));
              emit("change", e);
            },
          }),
          h("span", { class: "um-checkbox__box" }),
          h(
            "span",
            { class: "um-checkbox__label" },
            // The text beside the box. The named slot says it first, and the
            // default slot is the same content under the name Element Plus
            // gives it.
            slots.label ? slots.label() : slots.default ? slots.default() : [],
          ),
        ],
      );
  },
});
