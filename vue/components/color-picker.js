// ui-moods · Color Picker
//
// The chips are a real radio group, so the palette is a choice the browser
// owns: the arrow keys move between the colours and the browser announces the
// picked one. The chip's colour is data — the host's palette, not a theme
// value — so it arrives as a custom property the stylesheet reads.

import { defineComponent, h, useId } from "vue";

/**
 * The palette, as a list of `{ name, colour }`.
 *
 * The entries are written as "name #rrggbb", because a chip is a painted
 * colour and a painted colour carries no text: the name is what the radio
 * announces, the colour is what the chip paints.
 */
function parsePalette(palette) {
  return palette
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const at = entry.lastIndexOf(" ");
      return at === -1
        ? { name: entry, colour: entry }
        : { name: entry.slice(0, at), colour: entry.slice(at + 1) };
    });
}

export const UMColorPicker = defineComponent({
  name: "UMColorPicker",
  example: "basic",
  props: {
    value: { type: String, default: "#2f6feb" },
    palette: {
      type: String,
      default: "Blue #2f6feb,Green #12b886,Amber #f59f00,Red #e03131,Violet #7048e8",
    },
    label: { type: String, default: "" },
    hexLabel: { type: String, default: "" },
    paletteLabel: { type: String, default: "Palette" },
    disabled: { type: Boolean, default: false },
    variant: { type: String, default: "inline" },
    size: { type: String, default: "md" },
  },
  emits: ["input", "change"],
  setup(props, { emit }) {
    // The radios share a name, so it has to be this instance's own — two
    // pickers on one page may not steal each other's palette.
    const groupName = `um-color-picker-${useId()}`;

    return () => {
      const variant = props.variant === "stacked" ? "stacked" : "inline";
      const colours = parsePalette(props.palette);

      return h(
        "div",
        {
          class: [
            "um-color-picker",
            `um-color-picker--${variant}`,
            props.size === "sm"
              ? "um-color-picker--sm"
              : props.size === "lg"
                ? "um-color-picker--lg"
                : null,
          ],
        },
        [
          h("input", {
            class: "um-color-picker__swatch",
            type: "color",
            value: props.value || undefined,
            disabled: props.disabled,
            "aria-label": props.label || undefined,
            onInput: (e) => emit("input", e),
            onChange: (e) => emit("change", e),
          }),
          h(
            "div",
            {
              class: "um-color-picker__presets",
              role: "group",
              "aria-label": props.paletteLabel || undefined,
            },
            colours.map((entry) =>
              h(
                "label",
                { class: "um-color-picker__preset" },
                [
                  h("input", {
                    class: "um-color-picker__radio",
                    type: "radio",
                    name: groupName,
                    value: entry.colour,
                    checked: entry.colour === props.value,
                    disabled: props.disabled,
                    "aria-label": entry.name,
                    onChange: (e) => emit("change", e),
                  }),
                  h("span", {
                    class: "um-color-picker__chip",
                    style: { "--um-color-picker-preset": entry.colour },
                  }),
                ],
              ),
            ),
          ),
          h("input", {
            class: "um-color-picker__hex",
            type: "text",
            value: props.value || undefined,
            maxlength: 7,
            spellcheck: false,
            disabled: props.disabled,
            "aria-label": props.hexLabel || undefined,
            onInput: (e) => emit("input", e),
            onChange: (e) => emit("change", e),
          }),
        ],
      );
    };
  },
});
