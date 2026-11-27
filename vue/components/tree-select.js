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

import { defineComponent, h } from "vue";
import { modelValue, eventValue } from "../lib/model.mjs";

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
  },
  emits: ["change", "toggle", "update:modelValue"],
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
          ],
          role: "group",
        },
        [
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
                  slots.branch ? slots.branch({ label: props.label }) : props.label,
                ),
              ]),
              h(
                "div",
                { class: "um-tree-select__children" },
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
                          },
                        }),
                        h("span", { class: "um-tree-select__dot" }),
                        // A leaf that was not given a name of its own says what
                        // it submits.
                        h("span", { class: "um-tree-select__text" }, value),
                      ]),
                    ],
              ),
            ],
          ),
        ],
      );
    };
  },
});
