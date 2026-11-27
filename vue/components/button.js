// ui-moods · Button
//
// The size modifier is left off for the default size, because the stylesheet
// says the middle size needs no class. The glow is a quality hook: the rule
// lives in the shared layer, because a glow is a mood capability and not a
// button variant, but the class is the button's own and the manifest declares
// it as one of the button's states.
//
// The four shapes — the pill, the disc, the dashed outline and the link — are
// modifiers of their own, so a button can be a round link if the host asks
// for one.

import { defineComponent, h } from "vue";

export const UMButton = defineComponent({
  name: "UMButton",
  example: "variants",
  props: {
    variant: { type: String, default: "default" },
    size: { type: String, default: "md" },
    disabled: { type: Boolean, default: false },
    loading: { type: Boolean, default: false },
    glow: { type: Boolean, default: false },
    round: { type: Boolean, default: false },
    circle: { type: Boolean, default: false },
    dashed: { type: Boolean, default: false },
    link: { type: Boolean, default: false },
  },
  emits: ["click"],
  setup(props, { slots, emit }) {
    return () =>
      h(
        "button",
        {
          class: [
            "um-button",
            `um-button--${props.variant}`,
            props.size !== "md" ? `um-button--${props.size}` : null,
            props.loading ? "um-button--loading" : null,
            props.glow ? "um-button--glow" : null,
            props.round ? "um-button--round" : null,
            props.circle ? "um-button--circle" : null,
            props.dashed ? "um-button--dashed" : null,
            props.link ? "um-button--link" : null,
          ],
          disabled: props.disabled || undefined,
          onClick: (e) => emit("click", e),
        },
        slots.default ? slots.default() : [],
      );
  },
});
