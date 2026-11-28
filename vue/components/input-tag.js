// ui-moods · Input Tag
//
// The tags are the host's data, so they arrive as the default slot; with no
// slot the wrapper writes a short row, so the component is visible before
// anybody has fed it anything. Taking a tag away is the host's job too — the
// wrapper only draws the button.
//
// The tone belongs to the field rather than to one tag, because in CSS the
// modifier class sits on the root. The tag's surface is a second modifier, so
// the two compose: one says which colour the tag carries, the other says
// which surface it sits on.
//
// It answers to `v-model` as well as to `value`: a host that binds the field
// gets its own text back, and a host that writes `:value` gets exactly what
// it got before.

import { defineComponent, h } from "vue";
import { modelValue, eventValue } from "../lib/model.mjs";

/** The tones the stylesheet paints; the base class is the neutral tag. */
const VARIANTS = ["primary", "success", "warning", "danger"];

/** The surfaces a tag can sit on; the base class is the light one. */
const TAG_EFFECTS = ["dark", "plain"];

export const UMInputTag = defineComponent({
  name: "UMInputTag",
  example: "basic",
  props: {
    variant: { type: String, default: "" },
    size: { type: String, default: "md" },
    value: { type: String, default: "" },
    placeholder: { type: String, default: "Add a tag" },
    label: { type: String, default: "" },
    disabled: { type: Boolean, default: false },
    readonly: { type: Boolean, default: false },
    modelValue: { type: String, default: undefined },
    clearable: { type: Boolean, default: false },
    effect: { type: String, default: "light" },
    tagEffect: { type: String, default: "light" },
  },
  emits: ["input", "update:modelValue", "clear"],
  setup(props, { slots, emit }) {
    return () =>
      h(
        "div",
        {
          class: [
            "um-input-tag",
            VARIANTS.includes(props.variant) ? `um-input-tag--${props.variant}` : null,
            sizeClass(props.size),
            // The light surface is the base class on its own; the filled one
            // is the run that sits on a recessed surface.
            props.effect === "filled" ? "um-input-tag--filled" : null,
            // The light tag surface is the base class on its own; the other
            // two are the runs that change what the tag sits on.
            TAG_EFFECTS.includes(props.tagEffect)
              ? `um-input-tag--tag-effect-${props.tagEffect}`
              : null,
            props.clearable ? "um-input-tag--clearable" : null,
          ],
        },
        [
          h(
            "span",
            { class: "um-input-tag__prefix" },
            slots.prefix ? slots.prefix() : [],
          ),
          ...(slots.default ? slots.default() : fallbackTags(slots.tag)),
          h("input", {
            class: "um-input-tag__input",
            type: "text",
            value: modelValue(props, props.value) || undefined,
            placeholder: props.placeholder || undefined,
            disabled: props.disabled,
            readonly: props.readonly,
            "aria-label": props.label || undefined,
            onInput: (e) => {
              emit("update:modelValue", eventValue(e));
              emit("input", e);
            },
          }),
          // The clear button empties the text the wrapper holds. The tags are
          // the host's data, so taking them away is the host's business.
          h("button", {
            class: "um-input-tag__clear",
            type: "button",
            "aria-label": "Clear",
            onClick: () => {
              emit("update:modelValue", "");
              emit("clear");
            },
          }),
          h(
            "span",
            { class: "um-input-tag__suffix" },
            slots.suffix ? slots.suffix() : [],
          ),
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
function fallbackTags(tagSlot) {
  return [tag("Frontend", tagSlot), tag("Nightly", tagSlot), tag("Reconciliation", tagSlot)];
}

/** One tag, with the button that takes it back out. */
function tag(text, tagSlot) {
  return h("span", { class: "um-input-tag__tag" }, [
    h(
      "span",
      { class: "um-input-tag__text" },
      // The caller may write the words of a tag; the caller's own list of
      // tags carries its own words.
      tagSlot ? tagSlot({ text }) : text,
    ),
    h("button", {
      class: "um-input-tag__remove",
      type: "button",
      // The name says which tag, because a reader who hears ten of these in a
      // row needs to know which is which.
      "aria-label": `Remove ${text}`,
    }),
  ]);
}
