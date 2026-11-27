// ui-moods · Input Tag
//
// The tags are the host's data, so they arrive as the default slot; with no
// slot the wrapper writes a short row, so the component is visible before
// anybody has fed it anything. Taking a tag away is the host's job too — the
// wrapper only draws the button.
//
// The tone belongs to the field rather than to one tag, because in CSS the
// modifier class sits on the root.

import { defineComponent, h } from "vue";

/** The tones the stylesheet paints; the base class is the neutral tag. */
const VARIANTS = ["primary", "success", "warning", "danger"];

export const UMInputTag = defineComponent({
  name: "UMInputTag",
  example: "basic",
  props: {
    variant: { type: String, default: "" },
    size: { type: String, default: "md" },
    value: { type: String, default: "" },
    placeholder: { type: String, default: "Add a tag" },
    label: { type: String, default: "" },
  },
  emits: ["input"],
  setup(props, { slots, emit }) {
    return () =>
      h(
        "div",
        {
          class: [
            "um-input-tag",
            VARIANTS.includes(props.variant) ? `um-input-tag--${props.variant}` : null,
            sizeClass(props.size),
          ],
        },
        [
          ...(slots.default ? slots.default() : fallbackTags()),
          h("input", {
            class: "um-input-tag__input",
            type: "text",
            value: props.value || undefined,
            placeholder: props.placeholder || undefined,
            "aria-label": props.label || undefined,
            onInput: (e) => emit("input", e),
          }),
        ],
      );
  },
});

/** The medium field is the base class on its own. */
function sizeClass(size) {
  if (size === "sm") return "um-input-tag--sm";
  if (size === "lg") return "um-input-tag--lg";
  return null;
}

/** The tags in the field, when the caller has not written any. */
function fallbackTags() {
  return [tag("Frontend"), tag("Nightly"), tag("Reconciliation")];
}

/** One tag, with the button that takes it back out. */
function tag(text) {
  return h("span", { class: "um-input-tag__tag" }, [
    h("span", { class: "um-input-tag__text" }, text),
    h("button", {
      class: "um-input-tag__remove",
      type: "button",
      // The name says which tag, because a reader who hears ten of these in a
      // row needs to know which is which.
      "aria-label": `Remove ${text}`,
    }),
  ]);
}
