// ui-moods · Tag
//
// The neutral tag is the base class on its own, so the variant stays empty
// until the caller asks for a colour.
//
// The close mark is a real button, so the keyboard reaches it and the wrapper
// can report that it was pressed. The disabled state is told twice: the class
// paints it and aria-disabled says it, so a reader is told about it too.

import { defineComponent, h } from "vue";

export const UMTag = defineComponent({
  name: "UMTag",
  example: "variants",
  props: {
    variant: { type: String, default: "" },
    size: { type: String, default: "md" },
    effect: { type: String, default: "light" },
    closable: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    hit: { type: Boolean, default: false },
    round: { type: Boolean, default: false },
  },
  emits: ["close"],
  setup(props, { slots, emit }) {
    return () =>
      h(
        "span",
        {
          class: [
            "um-tag",
            props.variant ? `um-tag--${props.variant}` : null,
            // The medium tag is the base class; the modifier would only
            // repeat it.
            props.size !== "md" ? `um-tag--${props.size}` : null,
            props.effect === "plain"
              ? "um-tag--plain"
              : props.effect === "dark"
                ? "um-tag--dark"
                : null,
            props.closable ? "um-tag--closable" : null,
            props.disabled ? "um-tag--disabled" : null,
            props.hit ? "um-tag--hit" : null,
            props.round ? "um-tag--round" : null,
          ],
          "aria-disabled": props.disabled ? "true" : undefined,
        },
        [
          slots.default ? slots.default() : [],
          ...(props.closable
            ? [
                h(
                  "button",
                  {
                    type: "button",
                    class: "um-tag__close",
                    "aria-label": "Close",
                    onClick: () => emit("close"),
                  },
                ),
              ]
            : []),
        ],
      );
  },
});
