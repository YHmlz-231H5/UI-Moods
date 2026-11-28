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
//
// The field above the levels holds what the Element Plus API calls the input:
// the prefix, the chips that show the choice, the filter and the clear mark.
// Each of them is drawn only when its own class is on, so an empty field
// takes no room at all.

import { defineComponent, h } from "vue";

/** The chip colours the stylesheet paints. */
const TAG_TYPES = ["success", "warning", "danger", "info"];

export const UMCascader = defineComponent({
  name: "UMCascader",
  example: "inline",
  props: {
    open: { type: Boolean, default: false },
    layout: { type: String, default: "inline" },
    size: { type: String, default: "md" },
    label: { type: String, default: "" },
    disabled: { type: Boolean, default: false },
    clearable: { type: Boolean, default: false },
    collapseTags: { type: Boolean, default: false },
    effect: { type: String, default: "light" },
    filterable: { type: Boolean, default: false },
    fitInputWidth: { type: Boolean, default: false },
    placeholder: { type: String, default: "" },
    tagType: { type: String, default: "primary" },
    tagEffect: { type: String, default: "light" },
    virtualScroll: { type: Boolean, default: false },
  },
  emits: ["toggle", "clear"],
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
            props.clearable ? "um-cascader--clearable" : null,
            props.collapseTags ? "um-cascader--collapse-tags" : null,
            props.effect === "dark" ? "um-cascader--effect-dark" : null,
            props.effect === "plain" ? "um-cascader--effect-plain" : null,
            props.filterable ? "um-cascader--filterable" : null,
            props.fitInputWidth ? "um-cascader--fit-input-width" : null,
            props.tagType !== "primary" && TAG_TYPES.includes(props.tagType)
              ? `um-cascader--tag-${props.tagType}`
              : null,
            props.tagEffect === "dark" ? "um-cascader--tag-effect-dark" : null,
            props.tagEffect === "plain" ? "um-cascader--tag-effect-plain" : null,
            props.virtualScroll ? "um-cascader--virtual-scroll" : null,
          ],
          // A level is a disclosure rather than a form control, so it cannot
          // carry the disabled attribute itself.
          "aria-disabled": props.disabled ? "true" : undefined,
        },
        [
          h("div", { class: "um-cascader__field" }, [
            // The prefix is in the markup either way: an empty one is not
            // drawn.
            h(
              "span",
              { class: "um-cascader__prefix", "aria-hidden": "true" },
              slots.prefix ? slots.prefix() : [],
            ),
            h("div", { class: "um-cascader__tags" }, [
              h(
                "span",
                { class: "um-cascader__tag" },
                slots.tag ? slots.tag({ label: props.label, index: 0 }) : [],
              ),
            ]),
            h("input", {
              class: "um-cascader__filter",
              type: "search",
              placeholder: props.placeholder || undefined,
              "aria-label": props.placeholder || "Filter the levels",
            }),
            h("button", {
              class: "um-cascader__clear",
              type: "button",
              "aria-label": "Clear the choice",
              onClick: () => emit("clear"),
            }),
          ]),
          h("div", { class: "um-cascader__header" }, slots.header ? slots.header() : []),
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
                  : slots.default
                    ? slots.default({ label: props.label, open: props.open })
                    : [
                        h("span", { class: "um-cascader__label" }, props.label),
                        h("span", { class: "um-cascader__arrow", "aria-hidden": "true" }),
                      ],
              ),
              h(
                "div",
                { class: "um-cascader__children" },
                [
                  slots.children
                    ? slots.children({ label: props.label, open: props.open })
                    : [],
                  h(
                    "div",
                    { class: "um-cascader__empty" },
                    slots.empty ? slots.empty() : [],
                  ),
                ],
              ),
            ],
          ),
          h("div", { class: "um-cascader__footer" }, slots.footer ? slots.footer() : []),
        ],
      );
  },
});
