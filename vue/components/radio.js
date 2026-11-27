// ui-moods · Radio
//
// The circle is a real input inside a label and the drawn parts are spans, so
// the state is the browser's own `:checked`. Radios that share a name are one
// group, and the browser keeps the exclusivity — the wrapper only passes the
// name on.
//
// It answers to `v-model` as well as to `checked`. Inside a radio group the
// group owns the selection — the group says which value is picked — so an
// option in a group asks the group rather than its own prop.

import { defineComponent, h } from "vue";
import { modelValue, eventValue } from "../lib/model.mjs";
import { useGroup, isSelected } from "../lib/group.mjs";

export const UMRadio = defineComponent({
  name: "UMRadio",
  example: "group",
  props: {
    checked: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    name: { type: String, default: "" },
    value: { type: String, default: "" },
    modelValue: { type: Boolean, default: undefined },
  },
  emits: ["change", "update:modelValue"],
  setup(props, { slots, emit }) {
    const group = useGroup();

    // An option in a group is selected when the group says its value is the
    // picked one; an option on its own answers to its own prop.
    const isChecked = () =>
      group ? isSelected(group, props.value) : modelValue(props, props.checked);

    return () =>
      h("label", { class: "um-radio" }, [
        h("input", {
          class: "um-radio__input",
          type: "radio",
          checked: isChecked(),
          disabled: props.disabled,
          name: props.name || group?.name || undefined,
          value: props.value || undefined,
          onChange: (e) => {
            emit("update:modelValue", eventValue(e, true));
            emit("change", e);
          },
        }),
        h("span", { class: "um-radio__dot" }),
        h("span", { class: "um-radio__label" }, slots.label ? slots.label() : []),
      ]);
  },
});
