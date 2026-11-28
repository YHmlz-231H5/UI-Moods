// ui-moods · Tree Select
//
// A branch is a disclosure and a leaf is a radio, and the wrapper draws both:
// the <details> that opens, and the real input whose checked state is the
// browser's. The leaf that is picked is the caller's to choose — the wrapper
// hands it the name, the value and the disabled state, and takes the change
// event back out.
//
// It answers to `v-model` as well as to `value`: a host that binds the tree
// gets the picked leaf's value back, and a host that writes `:value` gets
// exactly what it got before.
//
// The field above the tree holds what the Element Plus API calls the input:
// the prefix, the chips that show the choice, the filter and the clear mark.
// Each of them is drawn only when its own class is on, so an empty field
// takes no room at all.

import { defineComponent, h } from "vue";
import { modelValue, eventValue } from "../lib/model.mjs";

/** The chip colours the stylesheet paints. */
const TAG_TYPES = ["success", "warning", "danger", "info"];

export const UMTreeSelect = defineComponent({
  name: "UMTreeSelect",
  example: "plain",
  props: {
    variant: { type: String, default: "plain" },
    size: { type: String, default: "md" },
    name: { type: String, default: "" },
    value: { type: String, default: "" },
    label: { type: String, default: "" },
    checked: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    modelValue: { type: String, default: undefined },
    showCheckbox: { type: Boolean, default: false },
    accordion: { type: Boolean, default: false },
    autoExpandParent: { type: Boolean, default: false },
    checkStrictly: { type: Boolean, default: false },
    defaultExpandAll: { type: Boolean, default: false },
    highlightCurrent: { type: Boolean, default: false },
    showArrow: { type: Boolean, default: true },
    clearable: { type: Boolean, default: false },
    collapseTags: { type: Boolean, default: false },
    filterable: { type: Boolean, default: false },
    fitInputWidth: { type: Boolean, default: false },
    effect: { type: String, default: "light" },
    loading: { type: Boolean, default: false },
    placeholder: { type: String, default: "" },
    tagType: { type: String, default: "primary" },
    tagEffect: { type: String, default: "light" },
  },
  emits: ["change", "toggle", "update:modelValue", "check", "clear"],
  setup(props, { slots, emit }) {
    return () => {
      // The value of the leaf: the binding when the host bound one, the
      // `value` prop when it did not.
      const value = modelValue(props, props.value);

      return h(
        "div",
        {
          class: [
            "um-tree-select",
            `um-tree-select--${props.variant}`,
            // The medium size is the base class itself, so it needs no
            // modifier — a class the stylesheet does not have paints nothing.
            props.size !== "md" ? `um-tree-select--${props.size}` : null,
            props.showCheckbox ? "um-tree-select--show-checkbox" : null,
            props.accordion ? "um-tree-select--accordion" : null,
            props.autoExpandParent ? "um-tree-select--auto-expand-parent" : null,
            props.checkStrictly ? "um-tree-select--check-strictly" : null,
            props.defaultExpandAll ? "um-tree-select--default-expand-all" : null,
            props.highlightCurrent ? "um-tree-select--highlight-current" : null,
            // A state that turns something off is written the other way
            // round, so the class always says what it does to the tree.
            !props.showArrow ? "um-tree-select--no-arrow" : null,
            props.clearable ? "um-tree-select--clearable" : null,
            props.collapseTags ? "um-tree-select--collapse-tags" : null,
            props.filterable ? "um-tree-select--filterable" : null,
            props.fitInputWidth ? "um-tree-select--fit-input-width" : null,
            props.effect === "dark" ? "um-tree-select--effect-dark" : null,
            props.effect === "plain" ? "um-tree-select--effect-plain" : null,
            props.loading ? "um-tree-select--loading" : null,
            props.tagType !== "primary" && TAG_TYPES.includes(props.tagType)
              ? `um-tree-select--tag-${props.tagType}`
              : null,
            props.tagEffect === "dark" ? "um-tree-select--tag-effect-dark" : null,
            props.tagEffect === "plain" ? "um-tree-select--tag-effect-plain" : null,
          ],
          role: "group",
        },
        [
          h("div", { class: "um-tree-select__field" }, [
            // The prefix is in the markup either way: an empty one is not
            // drawn.
            h(
              "span",
              { class: "um-tree-select__prefix", "aria-hidden": "true" },
              slots.prefix ? slots.prefix() : [],
            ),
            h("div", { class: "um-tree-select__tags" }, [
              h(
                "span",
                { class: "um-tree-select__tag" },
                slots.tag ? slots.tag({ label: value, index: 0 }) : [],
              ),
            ]),
            h("input", {
              class: "um-tree-select__filter",
              type: "search",
              placeholder: props.placeholder || undefined,
              "aria-label": props.placeholder || "Filter the tree",
            }),
            h("button", {
              class: "um-tree-select__clear",
              type: "button",
              "aria-label": "Clear the choice",
              onClick: () => {
                // The choice is gone, so the field says so: the value that
                // follows is the empty one.
                emit("clear");
                emit("update:modelValue", "");
              },
            }),
          ]),
          h("div", { class: "um-tree-select__header" }, slots.header ? slots.header() : []),
          h(
            "details",
            {
              class: "um-tree-select__node",
              open: true,
              onToggle: (e) => emit("toggle", e),
            },
            [
              h("summary", { class: "um-tree-select__option" }, [
                h("span", { class: "um-tree-select__arrow", "aria-hidden": "true" }),
                h(
                  "span",
                  { class: "um-tree-select__text" },
                  // What the branch says. The named slots say it first, and
                  // the default slot is the same content under the name
                  // Element Plus gives it.
                  slots.branch
                    ? slots.branch({ label: props.label })
                    : slots.label
                      ? slots.label({ label: props.label })
                      : slots.default
                        ? slots.default({ label: props.label })
                        : props.label,
                ),
              ]),
              h(
                "div",
                { class: "um-tree-select__children" },
                [
                  slots.children
                    ? slots.children({
                        name: props.name,
                        value,
                        checked: props.checked,
                        disabled: props.disabled,
                      })
                    : [
                        h("label", { class: "um-tree-select__option" }, [
                          h("input", {
                            class: "um-tree-select__input",
                            type: "radio",
                            name: props.name || undefined,
                            value: value || undefined,
                            checked: props.checked,
                            disabled: props.disabled,
                            onChange: (e) => {
                              emit("update:modelValue", eventValue(e));
                              emit("change", e);
                              // `check` is the name Element Plus gives the
                              // same event.
                              emit("check", e);
                            },
                          }),
                          h("span", { class: "um-tree-select__dot" }),
                          // A leaf that was not given a name of its own says what
                          // it submits.
                          h("span", { class: "um-tree-select__text" }, value),
                        ]),
                      ],
                  h(
                    "div",
                    { class: "um-tree-select__empty" },
                    slots.empty ? slots.empty() : [],
                  ),
                ],
              ),
            ],
          ),
          h("div", { class: "um-tree-select__footer" }, slots.footer ? slots.footer() : []),
          h(
            "div",
            { class: "um-tree-select__loading" },
            slots.loading ? slots.loading() : "Loading…",
          ),
        ],
      );
    };
  },
});
