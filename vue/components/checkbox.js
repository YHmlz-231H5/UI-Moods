// ui-moods · Checkbox
//
// The box is a real input inside a label and the drawn parts are spans, so the
// state is the browser's own `:checked` and the value submits with the form.
// The dash is the one state the markup cannot reach: `indeterminate` is a
// property of the element rather than an attribute, so it is set on mount.

import { defineComponent, h, onMounted, ref, watch } from "vue";

export const UMCheckbox = defineComponent({
  name: "UMCheckbox",
  example: "states",
  props: {
    checked: { type: Boolean, default: false },
    indeterminate: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    name: { type: String, default: "" },
    value: { type: String, default: "" },
  },
  emits: ["change"],
  setup(props, { slots, emit }) {
    const input = ref(null);

    const applyIndeterminate = () => {
      if (input.value) input.value.indeterminate = props.indeterminate;
    };
    onMounted(applyIndeterminate);
    watch(() => props.indeterminate, applyIndeterminate);

    return () =>
      h("label", { class: "um-checkbox" }, [
        h("input", {
          ref: input,
          class: "um-checkbox__input",
          type: "checkbox",
          checked: props.checked,
          disabled: props.disabled,
          name: props.name || undefined,
          value: props.value || undefined,
          onChange: (e) => emit("change", e),
        }),
        h("span", { class: "um-checkbox__box" }),
        h("span", { class: "um-checkbox__label" }, slots.label ? slots.label() : []),
      ]);
  },
});
