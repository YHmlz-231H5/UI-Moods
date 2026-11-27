// ui-moods · Mention
//
// The field is a real input and the names are real buttons, so the keyboard
// and the screen reader behave the way the reader expects without the library
// installing a listener of its own.
//
// The names are the host's data, so they arrive as the default slot. With no
// slot the wrapper writes a short list, so the component is visible before
// anybody has fed it anything.
//
// It answers to `v-model` as well as to `value`: a host that binds the field
// gets its own text back, and a host that writes `:value` gets exactly what it
// got before.

import { defineComponent, h } from "vue";
import { modelValue, eventValue } from "../lib/model.mjs";

/** The shapes the stylesheet paints. */
const VARIANTS = ["bordered", "plain", "round"];

export const UMMention = defineComponent({
  name: "UMMention",
  example: "basic",
  props: {
    variant: { type: String, default: "bordered" },
    size: { type: String, default: "md" },
    value: { type: String, default: "" },
    placeholder: { type: String, default: "Type @ to mention someone" },
    label: { type: String, default: "" },
    modelValue: { type: String, default: undefined },
  },
  emits: ["input", "update:modelValue"],
  setup(props, { slots, emit }) {
    return () =>
      h(
        "div",
        {
          class: [
            "um-mention",
            VARIANTS.includes(props.variant) ? `um-mention--${props.variant}` : "um-mention--bordered",
            sizeClass(props.size),
          ],
        },
        [
          h("div", { class: "um-mention__field" }, [
            h("input", {
              class: "um-mention__input",
              type: "text",
              value: modelValue(props, props.value) || undefined,
              placeholder: props.placeholder || undefined,
              "aria-label": props.label || undefined,
              onInput: (e) => {
                emit("update:modelValue", eventValue(e));
                emit("input", e);
              },
            }),
          ]),
          h("ul", { class: "um-mention__list" }, slots.default ? slots.default() : fallbackMentions()),
        ],
      );
  },
});

/** The medium field is the base class on its own. */
function sizeClass(size) {
  if (size === "sm") return "um-mention--sm";
  if (size === "lg") return "um-mention--lg";
  return null;
}

/** The names in the list, when the caller has not written any. */
function fallbackMentions() {
  return [mention("ZM", "@Zhao Ming"), mention("LW", "@Li Wei"), mention("CY", "@Chen Yu")];
}

/** One name in the list. */
function mention(initials, name) {
  return h("li", [
    h("button", { class: "um-mention__item", type: "button" }, [
      // The initials repeat the name, so the disc is hidden from the reader.
      h("span", { class: "um-mention__avatar", "aria-hidden": "true" }, initials),
      h("span", { class: "um-mention__name" }, name),
    ]),
  ]);
}
