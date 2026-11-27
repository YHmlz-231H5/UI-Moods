// ui-moods · Radio
//
// The circle is a real input inside a label and the drawn parts are spans, so
// the state is the browser's own `:checked`. Radios that share a name are one
// group, and the browser keeps the exclusivity — the wrapper only passes the
// name on.

import { defineComponent, h } from "vue";

export const UMRadio = defineComponent({
  name: "UMRadio",
  example: "group",
  props: {
    checked: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    name: { type: String, default: "" },
    value: { type: String, default: "" },
  },
  emits: ["change"],
  setup(props, { slots, emit }) {
    return () =>
      h("label", { class: "um-radio" }, [
        h("input", {
          class: "um-radio__input",
          type: "radio",
          checked: props.checked,
          disabled: props.disabled,
          name: props.name || undefined,
          value: props.value || undefined,
          onChange: (e) => emit("change", e),
        }),
        h("span", { class: "um-radio__dot" }),
        h("span", { class: "um-radio__label" }, slots.label ? slots.label() : []),
      ]);
  },
});
