// ui-moods · Color Picker Panel
//
// The swatches are real radio groups, so the arrow keys move between the
// colours of one group and the browser announces the picked one. A swatch is
// a painted colour and a painted colour carries no text, so every radio
// names itself.
//
// The colour of a swatch is data — the host's palette, not a theme value — so
// it arrives as a custom property the stylesheet reads, and the library
// carries no colour literal of its own.

import { defineComponent, h, useId } from "vue";
import { modelValue } from "../lib/model.mjs";

/** The theme's named colours, in the order the panel offers them. */
const HUES = ["primary", "success", "warning", "danger", "info"];

/**
 * The predefine list, as a list of `{ name, colour }`.
 *
 * An entry is written as "name #rrggbb", because a swatch is a painted
 * colour and a painted colour carries no text: the name is what the radio
 * announces, the colour is what the swatch paints. An entry that is only a
 * colour is announced as it is written.
 */
function parsePredefine(predefine) {
  return predefine
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

export const UMColorPickerPanel = defineComponent({
  name: "UMColorPickerPanel",
  example: "basic",
  props: {
    predefine: {
      type: String,
      default: "Blue #2f6feb,Green #12b886,Amber #f59f00,Red #e03131,Violet #7048e8",
    },
    hue: { type: String, default: "primary" },
    value: { type: String, default: "#2f6feb" },
    modelValue: { type: String, default: undefined },
    showPreview: { type: Boolean, default: true },
    disabled: { type: Boolean, default: false },
  },
  emits: ["change"],
  setup(props, { slots, emit }) {
    // The radios share a name, so it has to be this instance's own — two
    // panels on one page may not steal each other's colours.
    const predefineName = `um-color-picker-panel-predefine-${useId()}`;
    const hueName = `um-color-picker-panel-hue-${useId()}`;

    return () => {
      const swatches = parsePredefine(props.predefine);

      return h(
        "div",
        { class: ["um-color-picker-panel", "um-color-picker-panel--inline"] },
        [
          h("div", { class: "um-color-picker-panel__panel" }, [
            h(
              "div",
              {
                class: "um-color-picker-panel__predefine",
                role: "group",
                "aria-label": "Predefined colours",
              },
              swatches.map((entry) =>
                h(
                  "label",
                  {
                    class: "um-color-picker-panel__swatch",
                    style: { "--um-color-picker-panel-swatch": entry.colour },
                  },
                  [
                    h("input", {
                      type: "radio",
                      name: predefineName,
                      value: entry.colour,
                      checked: entry.colour === modelValue(props, props.value),
                      disabled: props.disabled,
                      "aria-label": entry.name,
                      onChange: (e) => emit("change", e),
                    }),
                  ],
                ),
              ),
            ),
            h(
              "div",
              {
                class: "um-color-picker-panel__hue",
                role: "group",
                "aria-label": "Theme colour",
              },
              HUES.map((tone) =>
                h("label", { class: "um-color-picker-panel__hue-swatch" }, [
                  h("input", {
                    type: "radio",
                    name: hueName,
                    value: tone,
                    checked: tone === props.hue,
                    disabled: props.disabled,
                    "aria-label": tone,
                    onChange: (e) => emit("change", e),
                  }),
                ]),
              ),
            ),
            h("div", { class: "um-color-picker-panel__value" }, [
              h("input", {
                class: "um-color-picker-panel__input",
                type: "text",
                value: modelValue(props, props.value) || undefined,
                maxlength: 7,
                spellcheck: false,
                disabled: props.disabled,
                "aria-label": "Hexadecimal value",
                onChange: (e) => emit("change", e),
              }),
              props.showPreview
                ? h("span", {
                    class: "um-color-picker-panel__preview",
                    style: { "--um-color-picker-panel-swatch": modelValue(props, props.value) },
                  })
                : null,
            ]),
            h("div", { class: "um-color-picker-panel__footer" }, slots.footer ? slots.footer() : []),
          ]),
        ],
      );
    };
  },
});
