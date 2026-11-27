// ui-moods · Popconfirm
//
// The open state is a checkbox, so the browser owns it: the label ticks the
// box, and ticking the box again closes the bubble. The wrapper owns the id
// that ties the two together, because two popconfirms on one page may not
// share one.

import { defineComponent, h, useId } from "vue";

/** The three placements that add a modifier; the fourth is the base class. */
const PLACEMENTS = ["top", "left", "right"];

export const UMPopconfirm = defineComponent({
  name: "UMPopconfirm",
  example: "basic",
  props: {
    placement: { type: String, default: "bottom" },
    size: { type: String, default: "md" },
    title: { type: String, default: "" },
    confirmText: { type: String, default: "Confirm" },
    cancelText: { type: String, default: "Cancel" },
    disabled: { type: Boolean, default: false },
    enterable: { type: Boolean, default: true },
    visible: { type: Boolean, default: false },
    showArrow: { type: Boolean, default: true },
    confirmButtonType: { type: String, default: "default" },
    cancelButtonType: { type: String, default: "default" },
  },
  setup(props, { slots }) {
    // The label and the checkbox have to name each other, so the pair needs an
    // id of this instance's own.
    const id = `um-popconfirm-${useId()}`;

    return () =>
      h(
        "div",
        {
          class: [
            "um-popconfirm",
            PLACEMENTS.includes(props.placement) ? `um-popconfirm--${props.placement}` : null,
            props.size === "sm" ? "um-popconfirm--sm" : props.size === "lg" ? "um-popconfirm--lg" : null,
            props.disabled ? "um-popconfirm--disabled" : null,
            props.enterable ? null : "um-popconfirm--not-enterable",
            props.showArrow ? null : "um-popconfirm--no-arrow",
          ],
        },
        [
          h("input", {
            class: "um-popconfirm__toggle",
            type: "checkbox",
            id,
            // The checked attribute is the browser's own: the bubble is open
            // when the host asks for it to be.
            checked: props.visible || undefined,
          }),
          h(
            "label",
            { class: "um-popconfirm__trigger", for: id },
            // With no slot the trigger falls back to the question, so the
            // component is usable with a single prop.
            slots.reference ? slots.reference() : slots.default ? slots.default() : props.title,
          ),
          h(
            "div",
            {
              class: "um-popconfirm__panel",
              role: "dialog",
              "aria-label": props.title || undefined,
            },
            [
              h("span", { class: "um-popconfirm__arrow", "aria-hidden": "true" }),
              h(
                "div",
                { class: "um-popconfirm__message" },
                slots.message ? slots.message({ title: props.title }) : props.title,
              ),
              h("div", { class: "um-popconfirm__actions" }, [
                slots.actions
                  ? slots.actions()
                  : [
                      h(
                        "button",
                        {
                          class: "um-popconfirm__cancel",
                          type: "button",
                          ...(props.cancelButtonType !== "default"
                            ? { "data-um-type": props.cancelButtonType }
                            : {}),
                        },
                        props.cancelText,
                      ),
                      h(
                        "button",
                        {
                          class: "um-popconfirm__confirm",
                          type: "button",
                          ...(props.confirmButtonType !== "default"
                            ? { "data-um-type": props.confirmButtonType }
                            : {}),
                        },
                        props.confirmText,
                      ),
                    ],
              ]),
            ],
          ),
        ],
      );
  },
});
