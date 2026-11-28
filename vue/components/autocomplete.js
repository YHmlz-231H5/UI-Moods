// ui-moods · Autocomplete
//
// The suggestions live in a native <datalist>, so the browser filters them
// while the reader types and the arrow keys walk them. The wrapper's only
// job is to carry the list from a string prop into the markup: it installs no
// listener and adds no behaviour the platform does not already have.
//
// It answers to `v-model` as well as to `value`: a host that binds the field
// gets its own text back, and a host that writes `:value` gets exactly what
// it got before.
//
// The clear button, the loading mark and the arrow are in the markup either
// way — the stylesheet decides which of them the field shows.

import { defineComponent, h, useId } from "vue";
import { modelValue, eventValue } from "../lib/model.mjs";

export const UMAutocomplete = defineComponent({
  name: "UMAutocomplete",
  example: "basic",
  props: {
    value: { type: String, default: "" },
    label: { type: String, default: "" },
    placeholder: { type: String, default: "" },
    suggestions: {
      type: String,
      default: "Amsterdam,Berlin,Copenhagen,Dublin,Edinburgh",
    },
    required: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    readonly: { type: Boolean, default: false },
    variant: { type: String, default: "bordered" },
    size: { type: String, default: "md" },
    modelValue: { type: String, default: undefined },
    clearable: { type: Boolean, default: false },
    loading: { type: Boolean, default: false },
    hideLoading: { type: Boolean, default: false },
    showArrow: { type: Boolean, default: false },
    type: { type: String, default: "text" },
    form: { type: String, default: "" },
  },
  emits: ["input", "change", "focus", "blur", "update:modelValue", "clear", "select"],
  setup(props, { slots, emit }) {
    // The field and its list need ids of their own, so two of them on one
    // page may not share one.
    const fieldId = `um-autocomplete-${useId()}`;

    return () => {
      const listId = `${fieldId}-suggestions`;
      const variant = props.variant === "filled" ? "filled" : "bordered";
      const suggestions = props.suggestions
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      // The text in the field: the binding when the host bound one, the
      // `value` prop when it did not.
      const value = modelValue(props, props.value);

      return h(
        "div",
        {
          class: [
            "um-autocomplete",
            `um-autocomplete--${variant}`,
            props.size === "sm"
              ? "um-autocomplete--sm"
              : props.size === "lg"
                ? "um-autocomplete--lg"
                : null,
            props.clearable ? "um-autocomplete--clearable" : null,
            props.loading ? "um-autocomplete--loading" : null,
            props.hideLoading ? "um-autocomplete--hide-loading" : null,
            props.showArrow ? "um-autocomplete--show-arrow" : null,
          ],
        },
        [
          h(
            "span",
            { class: "um-autocomplete__prepend" },
            slots.prepend ? slots.prepend() : [],
          ),
          h(
            "span",
            { class: "um-autocomplete__prefix" },
            slots.prefix ? slots.prefix() : [],
          ),
          h("input", {
            class: "um-autocomplete__input",
            type: props.type || "text",
            id: fieldId,
            name: fieldId,
            list: listId,
            value: value || undefined,
            placeholder: props.placeholder || undefined,
            required: props.required,
            disabled: props.disabled,
            readonly: props.readonly,
            form: props.form || undefined,
            "aria-label": props.label || undefined,
            onInput: (e) => {
              emit("update:modelValue", eventValue(e));
              emit("input", e);
            },
            onChange: (e) => {
              const next = eventValue(e);
              emit("update:modelValue", next);
              emit("change", e);
              // A committed value that is one of the suggestions is a
              // suggestion the reader picked rather than something they
              // typed: the browser writes the chosen text into the field
              // itself, so this is how the picking is noticed.
              if (suggestions.includes(next)) emit("select", next);
            },
            onFocus: (e) => emit("focus", e),
            onBlur: (e) => emit("blur", e),
          }),
          h(
            "span",
            { class: "um-autocomplete__suffix" },
            slots.suffix ? slots.suffix() : [],
          ),
          h(
            "span",
            { class: "um-autocomplete__loading" },
            slots.loading ? slots.loading() : [],
          ),
          h(
            "button",
            {
              class: "um-autocomplete__clear",
              type: "button",
              "aria-label": "Clear",
              onClick: () => {
                emit("update:modelValue", "");
                emit("clear");
              },
            },
          ),
          h("span", { class: "um-autocomplete__arrow" }),
          h(
            "span",
            { class: "um-autocomplete__append" },
            slots.append ? slots.append() : [],
          ),
          h(
            "datalist",
            { class: "um-autocomplete__list", id: listId },
            suggestions.map((s) =>
              h(
                "option",
                { class: "um-autocomplete__option", value: s },
                // A native <option> holds text and nothing else, so the slot
                // carries the words of the suggestion rather than a whole item.
                slots.default ? slots.default({ value: s }) : s,
              ),
            ),
          ),
        ],
      );
    };
  },
});
