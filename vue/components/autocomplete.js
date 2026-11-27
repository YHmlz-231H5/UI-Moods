// ui-moods · Autocomplete
//
// The suggestions live in a native <datalist>, so the browser filters them
// while the reader types and the arrow keys walk them. The wrapper's only
// job is to carry the list from a string prop into the markup: it installs no
// listener and adds no behaviour the platform does not already have.

import { defineComponent, h, useId } from "vue";

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
    variant: { type: String, default: "bordered" },
    size: { type: String, default: "md" },
  },
  emits: ["input", "change", "focus", "blur"],
  setup(props, { emit }) {
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
          ],
        },
        [
          h("input", {
            class: "um-autocomplete__input",
            type: "text",
            id: fieldId,
            name: fieldId,
            list: listId,
            value: props.value || undefined,
            placeholder: props.placeholder || undefined,
            required: props.required,
            disabled: props.disabled,
            "aria-label": props.label || undefined,
            onInput: (e) => emit("input", e),
            onChange: (e) => emit("change", e),
            onFocus: (e) => emit("focus", e),
            onBlur: (e) => emit("blur", e),
          }),
          h(
            "datalist",
            { class: "um-autocomplete__list", id: listId },
            suggestions.map((s) =>
              h("option", { class: "um-autocomplete__option", value: s }),
            ),
          ),
        ],
      );
    };
  },
});
