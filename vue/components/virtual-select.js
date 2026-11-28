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
//
// The field above the list holds what the Element Plus API calls the input:
// the prefix, the chips that show the choice, the filter and the clear mark.
// Each of them is drawn only when its own class is on, so an empty field
// takes no room at all.

import { defineComponent, h, useId } from "vue";
import { modelValue } from "../lib/model.mjs";

/** The chip colours the stylesheet paints. */
const TAG_TYPES = ["success", "warning", "danger", "info"];

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
    clearable: { type: Boolean, default: false },
    collapseTags: { type: Boolean, default: false },
    filterable: { type: Boolean, default: false },
    fitInputWidth: { type: Boolean, default: false },
    effect: { type: String, default: "light" },
    loading: { type: Boolean, default: false },
    tagType: { type: String, default: "primary" },
    tagEffect: { type: String, default: "light" },
  },
  emits: ["change", "update:modelValue", "clear"],
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
            h("div", { class: "um-virtual-select__option" }, [
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
            props.clearable ? "um-virtual-select--clearable" : null,
            props.collapseTags ? "um-virtual-select--collapse-tags" : null,
            props.filterable ? "um-virtual-select--filterable" : null,
            props.fitInputWidth ? "um-virtual-select--fit-input-width" : null,
            props.effect === "dark" ? "um-virtual-select--effect-dark" : null,
            props.effect === "plain" ? "um-virtual-select--effect-plain" : null,
            props.loading ? "um-virtual-select--loading" : null,
            props.tagType !== "primary" && TAG_TYPES.includes(props.tagType)
              ? `um-virtual-select--tag-${props.tagType}`
              : null,
            props.tagEffect === "dark" ? "um-virtual-select--tag-effect-dark" : null,
            props.tagEffect === "plain" ? "um-virtual-select--tag-effect-plain" : null,
          ],
          style: { "--um-virtual-select-height": props.height },
        },
        [
          h("div", { class: "um-virtual-select__field" }, [
            // The prefix is in the markup either way: an empty one is not
            // drawn.
            h(
              "span",
              { class: "um-virtual-select__prefix", "aria-hidden": "true" },
              slots.prefix ? slots.prefix() : [],
            ),
            h("div", { class: "um-virtual-select__tags" }, [
              h(
                "span",
                { class: "um-virtual-select__tag" },
                slots.tag ? slots.tag({ label: chosen, index: 0 }) : [],
              ),
            ]),
            h("input", {
              class: "um-virtual-select__filter",
              type: "search",
              "aria-label": "Filter the list",
            }),
            h("button", {
              class: "um-virtual-select__clear",
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
          h("div", { class: "um-virtual-select__scroller" }, [
            h("div", { class: "um-virtual-select__header" }, slots.header ? slots.header() : []),
            h(
              "div",
              {
                class: "um-virtual-select__list",
                role: "radiogroup",
                "aria-label": props.placeholder || undefined,
              },
              list,
            ),
            h("div", { class: "um-virtual-select__footer" }, slots.footer ? slots.footer() : []),
          ]),
          h(
            "div",
            { class: "um-virtual-select__loading" },
            slots.loading ? slots.loading() : "Loading…",
          ),
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
