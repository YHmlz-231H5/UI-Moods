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
// gets its own text back, and a host that writes `:value` gets exactly what
// it got before.

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
    disabled: { type: Boolean, default: false },
    readonly: { type: Boolean, default: false },
    clearable: { type: Boolean, default: false },
    loading: { type: Boolean, default: false },
    prefix: { type: String, default: "@" },
    showArrow: { type: Boolean, default: false },
    type: { type: String, default: "text" },
    form: { type: String, default: "" },
  },
  emits: ["input", "update:modelValue", "search", "select", "clear"],
  setup(props, { slots, emit }) {
    return () =>
      h(
        "div",
        {
          class: [
            "um-mention",
            VARIANTS.includes(props.variant) ? `um-mention--${props.variant}` : "um-mention--bordered",
            sizeClass(props.size),
            props.clearable ? "um-mention--clearable" : null,
            props.loading ? "um-mention--loading" : null,
            props.showArrow ? "um-mention--show-arrow" : null,
          ],
        },
        [
          h("div", { class: "um-mention__field" }, [
            h("span", { class: "um-mention__prefix" }, props.prefix),
            h("input", {
              class: "um-mention__input",
              type: props.type || "text",
              value: modelValue(props, props.value) || undefined,
              placeholder: props.placeholder || undefined,
              disabled: props.disabled,
              readonly: props.readonly,
              form: props.form || undefined,
              "aria-label": props.label || undefined,
              onInput: (e) => {
                const next = eventValue(e);
                emit("update:modelValue", next);
                emit("input", e);
                // The host is looking for names: the mention gives that
                // moment its own name.
                emit("search", next);
              },
            }),
            h(
              "span",
              { class: "um-mention__loading" },
              slots.loading ? slots.loading() : [],
            ),
            h("button", {
              class: "um-mention__clear",
              type: "button",
              "aria-label": "Clear",
              onClick: () => {
                emit("update:modelValue", "");
                emit("clear");
              },
            }),
            h("span", { class: "um-mention__arrow" }),
          ]),
          h("div", { class: "um-mention__header" }, slots.header ? slots.header() : []),
          h("ul", { class: "um-mention__list" }, slots.default ? slots.default() : fallbackMentions(slots.label, emit)),
          h("div", { class: "um-mention__footer" }, slots.footer ? slots.footer() : []),
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
function fallbackMentions(labelSlot, emit) {
  return [mention("ZM", "@Zhao Ming", labelSlot, emit), mention("LW", "@Li Wei", labelSlot, emit), mention("CY", "@Chen Yu", labelSlot, emit)];
}

/** One name in the list. */
function mention(initials, name, labelSlot, emit) {
  return h("li", [
    h(
      "button",
      {
        class: "um-mention__item",
        type: "button",
        onClick: () => emit("select", name),
      },
      [
        // The initials repeat the name, so the disc is hidden from the reader.
        h("span", { class: "um-mention__avatar", "aria-hidden": "true" }, initials),
        h("span", { class: "um-mention__name" }, labelSlot ? labelSlot({ name }) : name),
      ],
    ),
  ]);
}
