// ui-moods · Rate
//
// The stars are radio buttons under a drawn shape, so the group is the
// browser's group: the radios share a name, the browser keeps exactly one of
// them checked, and the arrow keys move the selection.
//
// The radios are hidden by size and opacity rather than removed, so they keep
// their place in the tab order and their name — and the stylesheet counts the
// checked radio's position to know how many stars are filled.
//
// It answers to `v-model` as well as to `value`: a host that binds the group
// gets its own score back, and a host that writes `:value` gets exactly what
// it got before.

import { defineComponent, h, useId } from "vue";
import { modelValue, eventValue } from "../lib/model.mjs";

/** The colours that are not the brand colour; the brand one is the base class. */
const COLORS = ["success", "warning", "danger"];

export const UMRate = defineComponent({
  name: "UMRate",
  example: "basic",
  props: {
    value: { type: Number, default: 0 },
    max: { type: Number, default: 5 },
    color: { type: String, default: "primary" },
    disabled: { type: Boolean, default: false },
    size: { type: String, default: "medium" },
    modelValue: { type: Number, default: undefined },
    showScore: { type: Boolean, default: false },
  },
  emits: ["change", "update:modelValue"],
  setup(props, { emit }) {
    const group = `um-rate-${useId()}`;

    return () => {
      const stars = [];
      const score = modelValue(props, props.value);
      for (let i = 1; i <= props.max; i++) {
        const id = `${group}-${i}`;
        stars.push(
          h("input", {
            class: "um-rate__input",
            type: "radio",
            name: group,
            id,
            value: String(i),
            "aria-label": `${i} out of ${props.max}`,
            checked: i === score,
            disabled: props.disabled,
            onChange: (e) => {
              emit("update:modelValue", Number(eventValue(e)));
              emit("change", e);
            },
          }),
        );
        stars.push(
          h("label", { class: "um-rate__item", for: id }, [
            h("span", { class: "um-rate__icon" }),
            h("span", { class: "um-rate__active" }),
          ]),
        );
      }

      return h(
        "div",
        {
          class: [
            "um-rate",
            COLORS.includes(props.color) ? `um-rate--${props.color}` : null,
            props.size !== "medium" ? `um-rate--${props.size}` : null,
            props.showScore ? "um-rate--show-score" : null,
          ],
          role: "radiogroup",
        },
        [
          ...stars,
          // The score is in the markup either way: the stylesheet decides
          // whether it is shown, so the number is always there to be read.
          h("span", { class: "um-rate__score" }, String(score)),
        ],
      );
    };
  },
});
