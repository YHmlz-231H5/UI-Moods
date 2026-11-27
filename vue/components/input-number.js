// ui-moods · Input Number — Vue 3 wrapper
//
// The field is a real `<input type="number">`, so the browser validates the
// value, the arrow keys change it and a screen reader announces it as a spin
// button. The two buttons are real buttons too — they are in the tab order
// and they can be pressed — but the library ships no glyphs, so their marks
// are drawn by the stylesheet and each button needs a name of its own.
//
// The buttons deliberately do not change the value: the library has no
// JavaScript, and a button that appears to work but does not is worse than
// one that is honest about being a mark.

import { defineComponent, h, useAttrs, computed } from "vue";

export const UMInputNumber = defineComponent({
  name: "UMInputNumber",
  // The manifest example this wrapper reproduces.
  example: "basic",

  inheritAttrs: false,

  props: {
    value: { type: Number, default: undefined },
    min: { type: Number, default: undefined },
    max: { type: Number, default: undefined },
    step: { type: Number, default: 1 },
    controlsPosition: { type: String, default: "right" },
    disabled: { type: Boolean, default: false },
  },

  emits: ["change"],

  setup(props, { emit, attrs }) {
    // The labels are attributes rather than props, because they are not
    // visual parameters of the control: the manifest does not describe them,
    // and a host that needs a Chinese label should be able to give one.
    const label = computed(() => attrs["aria-label"]);
    const increaseLabel = computed(() => attrs["increase-label"] ?? "Increase");
    const decreaseLabel = computed(() => attrs["decrease-label"] ?? "Decrease");

    return () =>
      h(
        "div",
        {
          class: [
            "um-input-number",
            props.controlsPosition !== "right" ? `um-input-number--${props.controlsPosition}` : "",
          ],
        },
        [
          h("div", { class: "um-input-number__wrapper" }, [
            h("input", {
              class: "um-input-number__input",
              type: "number",
              value: props.value,
              min: props.min,
              max: props.max,
              step: props.step,
              disabled: props.disabled || undefined,
              "aria-label": label.value,
              onChange: (e) => emit("change", e.target.value),
            }),
            h("span", { class: "um-input-number__controls" }, [
              h("button", {
                class: "um-input-number__increase",
                type: "button",
                disabled: props.disabled || undefined,
                "aria-label": increaseLabel.value,
              }),
              h("button", {
                class: "um-input-number__decrease",
                type: "button",
                disabled: props.disabled || undefined,
                "aria-label": decreaseLabel.value,
              }),
            ]),
          ]),
        ],
      );
  },
});
