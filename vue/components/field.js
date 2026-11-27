// ui-moods · Field
//
// The field owns the spacing around a control, so the label and the message
// are its own parts. The label has to point at the control, and the control is
// the caller's own element, so the wrapper looks for the first id in the
// default slot and writes it on the label's `for`.
//
// The field also owns the states the control cannot own for itself: the
// validation state, the size and whether the field is out of use. The control
// inside is still the caller's element — the field says the field is out of
// use, and the host is the one who switches the control off.

import { defineComponent, h } from "vue";

export const UMField = defineComponent({
  name: "UMField",
  example: "layout",
  props: {
    error: { type: Boolean, default: false },
    validateStatus: { type: String, default: "" },
    disabled: { type: Boolean, default: false },
    inline: { type: Boolean, default: false },
    size: { type: String, default: "md" },
  },
  setup(props, { slots }) {
    return () => {
      const control = slots.default ? slots.default() : [];
      const status = props.validateStatus || (props.error ? "error" : "");
      return h(
        "div",
        {
          class: [
            "um-field",
            // The error state is reachable two ways: the `error` prop and the
            // validation status. They paint the same class.
            props.error ? "um-field--error" : null,
            status && status !== "error" ? `um-field--${status}` : null,
            props.disabled ? "um-field--disabled" : null,
            props.inline ? "um-field--inline" : null,
            // The medium size is the base class itself, so it needs no
            // modifier — a class the stylesheet does not have paints nothing.
            props.size !== "md" ? `um-field--${props.size}` : null,
          ],
          // The field is a container rather than a control, so it cannot
          // carry the disabled attribute itself.
          "aria-disabled": props.disabled ? "true" : undefined,
        },
        [
          h(
            "label",
            { class: "um-field__label", for: firstId(control) || undefined },
            slots.label ? slots.label() : [],
          ),
          control,
          h("span", { class: "um-field__message" }, slots.message ? slots.message() : []),
        ],
      );
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
