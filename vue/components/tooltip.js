// ui-moods · Tooltip
//
// The bubble is written after the trigger and points at it with
// aria-describedby, so the two need an id no other tooltip on the page
// shares. The bubble opens on hover and on focus, so the keyboard reaches
// everything the pointer reaches.

import { defineComponent, h, useId } from "vue";

/** The bottom placement is the base class; the other three add a modifier. */
const PLACEMENTS = ["top", "left", "right"];

export const UMTooltip = defineComponent({
  name: "UMTooltip",
  example: "basic",
  props: {
    placement: { type: String, default: "bottom" },
    text: { type: String, default: "" },
    disabled: { type: Boolean, default: false },
    enterable: { type: Boolean, default: true },
    showArrow: { type: Boolean, default: true },
    visible: { type: Boolean, default: false },
    effect: { type: String, default: "light" },
  },
  setup(props, { slots }) {
    const id = `um-tooltip-${useId()}`;

    return () => {
      const content = slots.content ? slots.content({ text: props.text }) : props.text;
      return h(
        "span",
        {
          class: [
            "um-tooltip",
            PLACEMENTS.includes(props.placement) ? `um-tooltip--${props.placement}` : null,
            props.disabled ? "um-tooltip--disabled" : null,
            props.enterable ? null : "um-tooltip--not-enterable",
            props.showArrow ? null : "um-tooltip--no-arrow",
            props.visible ? "um-tooltip--visible" : null,
            // The light bubble is the base class on its own.
            props.effect === "dark" ? "um-tooltip--dark" : null,
          ],
        },
        [
          h(
            "button",
            { class: "um-tooltip__trigger", type: "button", "aria-describedby": id },
            slots.default ? slots.default() : [],
          ),
          h("span", { class: "um-tooltip__content", id, role: "tooltip" }, [
            content,
            h("span", { class: "um-tooltip__arrow", "aria-hidden": "true" }),
          ]),
        ],
      );
    };
  },
});
