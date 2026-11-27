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

import { defineComponent, h, useId } from "vue";

export const UMVirtualSelect = defineComponent({
  name: "UMVirtualSelect",
  example: "long-list",
  props: {
    value: { type: String, default: "Aardvark" },
    options: {
      type: String,
      default:
        "Aardvark,Albatross,Badger,Barracuda,Beetle,Bison,Butterfly,Capybara,Caribou,Chameleon,Cheetah,Chinchilla",
    },
    placeholder: { type: String, default: "Choose a species" },
    height: { type: String, default: "12em" },
  },
  emits: ["change"],
  setup(props, { emit }) {
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
      const chosen = labels.includes(props.value) ? props.value : labels[0];

      return h(
        "div",
        {
          class: ["um-virtual-select", "um-virtual-select--bordered"],
          style: { "--um-virtual-select-height": props.height },
        },
        [
          h("div", { class: "um-virtual-select__scroller" }, [
            h(
              "div",
              {
                class: "um-virtual-select__list",
                role: "listbox",
                "aria-label": props.placeholder || undefined,
              },
              labels.map((label) =>
                h("div", { class: "um-virtual-select__option", role: "option" }, [
                  h("label", { class: "um-virtual-select__label" }, [
                    h("input", {
                      type: "radio",
                      name: groupName,
                      value: label,
                      checked: label === chosen,
                      "aria-label": label,
                      onChange: (e) => emit("change", e),
                    }),
                    h("span", { class: "um-virtual-select__text" }, label),
                  ]),
                ]),
              ),
            ),
          ]),
        ],
      );
    };
  },
});
