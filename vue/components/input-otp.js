// ui-moods · Input OTP
//
// The boxes are one-character inputs rather than one input with the characters
// drawn inside it, because a real input keeps the keyboard, the autofill and
// the password manager. The price is that the caret does not walk from one
// box to the next on its own: the library has no script, so the host moves
// it, and the reader can always Tab through the boxes in the meantime.

import { defineComponent, h } from "vue";

export const UMInputOtp = defineComponent({
  name: "UMInputOtp",
  example: "basic",
  props: {
    value: { type: String, default: "" },
    length: { type: Number, default: 6 },
    masked: { type: Boolean, default: false },
    label: { type: String, default: "One-time code" },
    disabled: { type: Boolean, default: false },
    variant: { type: String, default: "boxed" },
    size: { type: String, default: "md" },
    readonly: { type: Boolean, default: false },
  },
  emits: ["input", "change"],
  setup(props, { slots, emit }) {
    return () => {
      const variant = props.variant === "underline" ? "underline" : "boxed";
      const boxes = [];

      for (let at = 0; at < props.length; at += 1) {
        boxes.push(
          h("input", {
            class: "um-input-otp__field",
            type: props.masked ? "password" : "text",
            inputmode: "numeric",
            maxlength: 1,
            value: props.value[at] || undefined,
            // The first box asks the browser for the one-time-code autofill,
            // which is where a code arriving by message goes.
            autocomplete: at === 0 ? "one-time-code" : "off",
            // A blank box carries no text of its own, so each one names itself
            // by its position.
            "aria-label": `Digit ${at + 1}`,
            disabled: props.disabled,
            readonly: props.readonly,
            onInput: (e) => emit("input", e),
            onChange: (e) => emit("change", e),
          }),
        );

        // The separator goes between the boxes, so there is none after the
        // last one.
        if (at < props.length - 1) {
          boxes.push(
            h(
              "span",
              { class: "um-input-otp__separator" },
              slots.separator ? slots.separator({ index: at }) : [],
            ),
          );
        }
      }

      return h(
        "div",
        {
          class: [
            "um-input-otp",
            `um-input-otp--${variant}`,
            props.size === "sm"
              ? "um-input-otp--sm"
              : props.size === "lg"
                ? "um-input-otp--lg"
                : null,
          ],
          role: "group",
          "aria-label": props.label || undefined,
        },
        boxes,
      );
    };
  },
});
