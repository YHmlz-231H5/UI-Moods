// ui-moods · Field
//
// The field owns the spacing around a control, so the label and the message
// are its own parts. The label has to point at the control, and the control is
// the caller's own element, so the wrapper looks for the first id in the
// default slot and writes it on the label's `for`.

import { defineComponent, h } from "vue";

export const UMField = defineComponent({
  name: "UMField",
  example: "layout",
  props: {
    error: { type: Boolean, default: false },
  },
  setup(props, { slots }) {
    return () => {
      const control = slots.default ? slots.default() : [];
      return h("div", { class: ["um-field", props.error ? "um-field--error" : null] }, [
        h(
          "label",
          { class: "um-field__label", for: firstId(control) || undefined },
          slots.label ? slots.label() : [],
        ),
        control,
        h("span", { class: "um-field__message" }, slots.message ? slots.message() : []),
      ]);
    };
  },
});

/**
 * The id of the first element a slot holds.
 *
 * The control in a field is the caller's own element, so the label can only
 * point at it by looking for the id the caller already gave it.
 */
function firstId(vnodes) {
  for (const vnode of vnodes ?? []) {
    if (!vnode || typeof vnode !== "object") continue;
    if (vnode.props?.id) return vnode.props.id;
    if (Array.isArray(vnode.children)) {
      const found = firstId(vnode.children);
      if (found) return found;
    }
  }
  return "";
}
