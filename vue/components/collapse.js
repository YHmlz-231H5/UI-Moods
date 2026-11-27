// ui-moods · Collapse
//
// A panel is a disclosure, not a menu: the browser owns the open state, so the
// panel stays open across a reload and the reader gets the collapsed and
// expanded announcement for free. The open prop is the native open attribute
// on the details, and the toggle event is the browser's own.
//
// The wrapper draws one panel — the header, its title, the mark that says the
// panel opens and the body — and the default slot is where the body goes.
//
// The panel also answers to v-model, the way every value-bearing component in
// the library does: the binding wins over the `open` prop when it is there,
// and the open state is published when the panel opens or closes.

import { defineComponent, h } from "vue";
import { modelValue } from "../lib/model.mjs";

export const UMCollapse = defineComponent({
  name: "UMCollapse",
  example: "plain",
  props: {
    open: { type: Boolean, default: false },
    modelValue: { type: Boolean, default: undefined },
    variant: { type: String, default: "plain" },
    size: { type: String, default: "md" },
    title: { type: String, default: "" },
    disabled: { type: Boolean, default: false },
    expandIconPosition: { type: String, default: "end" },
  },
  emits: ["toggle", "update:modelValue"],
  setup(props, { slots, emit }) {
    return () => {
      // The binding wins when it is there; the open prop is the fallback.
      const open = modelValue(props, props.open);

      return h(
        "details",
        {
          class: [
            "um-collapse",
            props.variant === "card"
              ? "um-collapse--card"
              : props.variant === "plain"
                ? "um-collapse--plain"
                : null,
            props.size === "sm"
              ? "um-collapse--sm"
              : props.size === "lg"
                ? "um-collapse--lg"
                : null,
            props.disabled ? "um-collapse--disabled" : null,
            // The ends are written logically, so the arrow moves with the
            // reading direction. The end run is the base class; the modifier
            // would only repeat it.
            props.expandIconPosition === "start" ? "um-collapse--icon-start" : null,
          ],
          open,
          // A disclosure is not a form control, so it cannot carry the
          // disabled attribute itself. The state is written on the element
          // instead, so the reader is told about it too.
          "aria-disabled": props.disabled ? "true" : undefined,
          onToggle: (e) => {
            emit("update:modelValue", e.target?.open ?? open);
            emit("toggle", e);
          },
        },
        [
          h(
            "summary",
            { class: "um-collapse__header" },
            slots.header
              ? slots.header({ title: props.title, open })
              : [
                  h("span", { class: "um-collapse__title" }, props.title),
                  h("span", { class: "um-collapse__arrow", "aria-hidden": "true" }),
                ],
          ),
          h(
            "div",
            { class: "um-collapse__content" },
            slots.default ? slots.default({ open }) : [],
          ),
        ],
      );
    };
  },
});
