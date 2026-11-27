// ui-moods · Link
//
// An <a> has no disabled attribute, so the disabled state is aria-disabled:
// the link keeps its place in the tab order and is still announced. The
// stylesheet makes it inert to the pointer, and the wrapper refuses the
// activation, because a keyboard reader still reaches it.

import { defineComponent, h } from "vue";

export const UMLink = defineComponent({
  name: "UMLink",
  example: "types",
  props: {
    href: { type: String, default: "#" },
    variant: { type: String, default: "primary" },
    size: { type: String, default: "md" },
    underline: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
  },
  emits: ["click"],
  setup(props, { slots, emit }) {
    return () =>
      h(
        "a",
        {
          class: [
            "um-link",
            `um-link--${props.variant}`,
            props.size !== "md" ? `um-link--${props.size}` : null,
            props.underline ? "um-link--underline" : null,
          ],
          href: props.href,
          "aria-disabled": props.disabled ? "true" : undefined,
          onClick: (e) => {
            if (props.disabled) {
              e.preventDefault();
              return;
            }
            emit("click", e);
          },
        },
        slots.default ? slots.default() : [],
      );
  },
});
