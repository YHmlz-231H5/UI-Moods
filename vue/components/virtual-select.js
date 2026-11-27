// ui-moods · Virtual Select
//
// The rows far from the viewport are not laid out: the stylesheet gives each
// row `content-visibility: auto` and the size of a row that has not been
// looked at yet. Nothing about the choice changes — the virtualisation is
// about the painting, not about the value.
//
// The options are real radios inside labels, the way the library's other
// radio groups are, so the selection is a form value the host can read, the
// choice is in the tab order and the browser announces the picked one.
//
// It answers to `v-model` as well as to `value`: a host that binds the list
// gets its own choice back, and a host that writes `:value` gets exactly
// what it got before.
//
// The slots fill the parts the stylesheet already declares: what one option
// says, what the list says when it holds nothing, and what stands above and
// below the options.

import { defineComponent, h, useId } from "vue";
import { modelValue } from "../lib/model.mjs";

export const UMVirtualSelect = defineComponent({
  name: "UMVirtualSelect",
  example: "long-list",
  props: {
    value: { type: String, default: "Aardvark" },
    modelValue: { type: String, default: undefined },
    options: {
      type: String,
      default:
        "Aardvark,Albatross,Badger,Barracuda,Beetle,Bison,Butterfly,Capybara,Caribou,Chameleon,Cheetah,Chinchilla",
    },
    placeholder: { type: String, default: "Choose a species" },
    height: { type: String, default: "12em" },
    size: { type: String, default: "md" },
    disabled: { type: Boolean, default: false },
    scrollbarAlwaysOn: { type: Boolean, default: false },
  },
  emits: ["change", "update:modelValue"],
  setup(props, { slots, emit }) {
    // The radios share a name, so it has to be this instance's own — two
    // lists on one page may not steal each other's choice.
    const groupName = `um-virtual-select-${useId()}`;

    return () => {
      const labels = props.options
        .split(",")
        .map((label) => label.trim())
        .filter(Boolean);
      // A value that names no option would leave the list with nothing
      // chosen, so the first option stands in for it.
      const value = modelValue(props, props.value);
      const chosen = labels.includes(value) ? value : labels[0];

      const list = labels.length
        ? labels.map((label, index) =>
            h("div", { class: "um-virtual-select__option", role: "option" }, [
              h("label", { class: "um-virtual-select__label" }, [
                h("input", {
                  type: "radio",
                  name: groupName,
                  value: label,
                  checked: label === chosen,
                  disabled: props.disabled,
                  "aria-label": label,
                  onChange: (e) => {
                    // The radio's own value is the choice, so the host is
                    // told which one was picked rather than that
                    // something was picked.
                    emit("update:modelValue", e?.target?.value ?? chosen);
                    emit("change", e);
                  },
                }),
                h(
                  "span",
                  { class: "um-virtual-select__text" },
                  // What the option says. The named slot says it first, and
                  // the default slot is the same content under the name
                  // Element Plus gives it.
                  slots.label
                    ? slots.label({ label, index })
                    : slots.default
                      ? slots.default({ label, index })
                      : label,
                ),
              ]),
            ]),
          )
        : [
            h(
              "div",
              { class: "um-virtual-select__empty", role: "presentation" },
              slots.empty ? slots.empty() : "No data",
            ),
          ];

      return h(
        "div",
        {
          class: [
            "um-virtual-select",
            "um-virtual-select--bordered",
            sizeClass(props.size),
            props.scrollbarAlwaysOn ? "um-virtual-select--scrollbar-always-on" : null,
          ],
          style: { "--um-virtual-select-height": props.height },
        },
        [
          h("div", { class: "um-virtual-select__scroller" }, [
            h("div", { class: "um-virtual-select__header" }, slots.header ? slots.header() : []),
            h(
              "div",
              {
                class: "um-virtual-select__list",
                role: "listbox",
                "aria-label": props.placeholder || undefined,
              },
              list,
            ),
            h("div", { class: "um-virtual-select__footer" }, slots.footer ? slots.footer() : []),
          ]),
        ],
      );
    };
  },
});

/** The medium size is the base class on its own. */
function sizeClass(size) {
  if (size === "sm") return "um-virtual-select--sm";
  if (size === "lg") return "um-virtual-select--lg";
  return null;
}
