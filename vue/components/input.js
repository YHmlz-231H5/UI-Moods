// ui-moods · Input / Textarea / Select
//
// The three controls are three classes rather than three variants of one
// class, so the `control` prop picks the element and the class together. The
// events are the browser's own; the wrapper only says which of them it
// forwards.

import { defineComponent, h } from "vue";

/** Which class each member of the family carries. */
const CONTROL_CLASS = {
  input: "um-input",
  textarea: "um-textarea",
  select: "um-select",
};

export const UMInput = defineComponent({
  name: "UMInput",
  example: "controls",
  props: {
    control: { type: String, default: "input" },
    placeholder: { type: String, default: "" },
    disabled: { type: Boolean, default: false },
    readonly: { type: Boolean, default: false },
  },
  emits: ["input", "change", "focus", "blur"],
  setup(props, { slots, emit }) {
    return () => {
      const control = props.control in CONTROL_CLASS ? props.control : "input";
      const common = {
        class: CONTROL_CLASS[control],
        disabled: props.disabled,
        onInput: (e) => emit("input", e),
        onChange: (e) => emit("change", e),
        onFocus: (e) => emit("focus", e),
        onBlur: (e) => emit("blur", e),
      };

      if (control === "select") {
        return h("select", common, slots.default ? slots.default() : []);
      }

      // The placeholder and the read-only state belong to the two text
      // controls; the select has neither.
      const text = {
        ...common,
        type: control === "textarea" ? undefined : "text",
        placeholder: props.placeholder || undefined,
        readonly: props.readonly,
        rows: control === "textarea" ? 3 : undefined,
      };
      return control === "textarea" ? h("textarea", text) : h("input", text);
    };
  },
});
