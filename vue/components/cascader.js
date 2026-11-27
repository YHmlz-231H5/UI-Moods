// ui-moods · Cascader
//
// A level is a disclosure, not a menu: the browser owns the open state, so
// the branch stays open across a reload and the reader gets the collapsed and
// expanded announcement for free. The open prop is the native open attribute
// on the details, and the toggle event is the browser's own.
//
// The wrapper draws one level — the panel, the option, its text and the mark
// that says a level hangs below it — and the children slot is where the level
// below goes, written as the panel markup the example shows.

import { defineComponent, h } from "vue";

export const UMCascader = defineComponent({
  name: "UMCascader",
  example: "inline",
  props: {
    open: { type: Boolean, default: false },
    layout: { type: String, default: "inline" },
    size: { type: String, default: "md" },
    label: { type: String, default: "" },
    disabled: { type: Boolean, default: false },
  },
  emits: ["toggle"],
  setup(props, { slots, emit }) {
    return () =>
      h(
        "div",
        {
          class: [
            "um-cascader",
            props.layout === "flyout" ? "um-cascader--flyout" : "um-cascader--inline",
            props.size === "sm"
              ? "um-cascader--sm"
              : props.size === "lg"
                ? "um-cascader--lg"
                : null,
            props.disabled ? "um-cascader--disabled" : null,
          ],
          // A level is a disclosure rather than a form control, so it cannot
          // carry the disabled attribute itself.
          "aria-disabled": props.disabled ? "true" : undefined,
        },
        [
          h(
            "details",
            {
              class: "um-cascader__panel",
              open: props.open,
              onToggle: (e) => emit("toggle", e),
            },
            [
              h(
                "summary",
                { class: "um-cascader__option" },
                slots.option
                  ? slots.option({ label: props.label, open: props.open })
                  : [
                      h("span", { class: "um-cascader__label" }, props.label),
                      h("span", { class: "um-cascader__arrow", "aria-hidden": "true" }),
                    ],
              ),
              h(
                "div",
                { class: "um-cascader__children" },
                slots.children ? slots.children({ label: props.label, open: props.open }) : [],
              ),
            ],
          ),
        ],
      );
  },
});
