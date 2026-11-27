// ui-moods · Segmented
//
// The row is a group of radios and not a row of buttons: the browser keeps
// exactly one of them picked and the arrow keys move the selection along the
// row, so the wrapper hands the caller's own options back with the classes
// the stylesheet declares. The radio is the real control — it is hidden by
// size and opacity, not removed — so the group stays operable by keyboard.
//
// The wrapper keeps the row, its name and the classes; the options are the
// caller's own elements, and the option slot is the template for the single
// option the wrapper's own props describe.

import { defineComponent, h } from "vue";

export const UMSegmented = defineComponent({
  name: "UMSegmented",
  example: "soft",
  props: {
    name: { type: String, default: "" },
    value: { type: String, default: "" },
    checked: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    variant: { type: String, default: "soft" },
    size: { type: String, default: "md" },
    label: { type: String, default: "" },
    block: { type: Boolean, default: false },
  },
  emits: ["change"],
  setup(props, { slots, emit }) {
    return () => {
      const options = slots.default ? slots.default() : [];
      const painted = options.length ? options.map(paintOption) : [fallbackOption(props)];

      return h(
        "div",
        {
          class: [
            "um-segmented",
            props.variant === "solid"
              ? "um-segmented--solid"
              : props.variant === "ghost"
                ? "um-segmented--ghost"
                : "um-segmented--soft",
            props.size === "sm"
              ? "um-segmented--sm"
              : props.size === "lg"
                ? "um-segmented--lg"
                : null,
            props.block ? "um-segmented--block" : null,
          ],
          role: "radiogroup",
          "aria-label": props.label || undefined,
          // The change event bubbles out of the radio, so the handler sits on
          // the row: it fires for the caller's options and for the wrapper's
          // alike.
          onChange: (e) => emit("change", e),
        },
        painted,
      );
    };
  },
});

/**
 * The class one option carries, and the classes of what is inside it.
 *
 * The option is a label wrapping a radio and its text, so the wrapper knows
 * which is which without the caller having to say it: the radio is the
 * control and the span is the text.
 */
function paintOption(vnode) {
  if (!vnode || typeof vnode !== "object" || !vnode.type) return vnode;

  const children = (Array.isArray(vnode.children) ? vnode.children : [vnode.children])
    .filter(Boolean)
    .map((child) => {
      if (typeof child !== "object" || !child.type) return child;
      if (child.type === "input") {
        return h("input", { ...child.props, class: "um-segmented__input" });
      }
      if (child.type === "span") {
        return h("span", { ...child.props, class: "um-segmented__label" });
      }
      return child;
    });

  return h(
    vnode.type,
    { ...vnode.props, class: ["um-segmented__option", vnode.props?.class] },
    children,
  );
}

/** The row with nothing in it: one option, built from the wrapper's own props. */
function fallbackOption(props) {
  return h("label", { class: "um-segmented__option" }, [
    h("input", {
      class: "um-segmented__input",
      type: "radio",
      name: props.name || undefined,
      value: props.value || undefined,
      checked: props.checked,
      disabled: props.disabled,
    }),
    h("span", { class: "um-segmented__label" }, props.value),
  ]);
}
