// ui-moods · Time Select
//
// The field is a box with a real <select> inside it. The times in the list
// are the host's data, so the wrapper writes them out from the start, the end
// and the step — the markup the stylesheet expects, with nothing added to it.
//
// It answers to `v-model` as well as to `value`: a host that binds the field
// gets its own time back, and a host that writes `:value` gets exactly what
// it got before.

import { defineComponent, h } from "vue";
import { modelValue, eventValue } from "../lib/model.mjs";

/** A time of day, in seconds since midnight. */
function seconds(time) {
  const [hours, minutes] = String(time)
    .split(":")
    .map((part) => Number(part));
  return (hours || 0) * 3600 + (minutes || 0) * 60;
}

/** The times from `start` to `end`, one every `step` seconds. */
function timeOptions(start, end, step) {
  const out = [];
  const last = seconds(end);
  for (let at = seconds(start); at <= last; at += step) {
    const hours = Math.floor(at / 3600);
    const minutes = Math.floor((at % 3600) / 60);
    out.push(
      `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`,
    );
  }
  return out;
}

export const UMTimeSelect = defineComponent({
  name: "UMTimeSelect",
  example: "basic",
  props: {
    value: { type: String, default: "" },
    start: { type: String, default: "09:00" },
    end: { type: String, default: "17:00" },
    step: { type: Number, default: 1800 },
    label: { type: String, default: "" },
    disabled: { type: Boolean, default: false },
    variant: { type: String, default: "bordered" },
    size: { type: String, default: "md" },
    modelValue: { type: String, default: undefined },
  },
  emits: ["change", "update:modelValue"],
  setup(props, { emit }) {
    return () => {
      const variant = props.variant === "filled" ? "filled" : "bordered";
      const options = timeOptions(props.start, props.end, props.step);
      const chosen = modelValue(props, props.value);

      return h(
        "div",
        {
          class: [
            "um-time-select",
            `um-time-select--${variant}`,
            props.size === "sm"
              ? "um-time-select--sm"
              : props.size === "lg"
                ? "um-time-select--lg"
                : null,
          ],
        },
        [
          h(
            "select",
            {
              class: "um-time-select__select",
              disabled: props.disabled,
              "aria-label": props.label || undefined,
              onChange: (e) => {
                emit("update:modelValue", eventValue(e));
                emit("change", e);
              },
            },
            options.map((time) =>
              h(
                "option",
                {
                  class: "um-time-select__option",
                  value: time,
                  selected: time === chosen,
                },
                time,
              ),
            ),
          ),
          h("span", { class: "um-time-select__arrow", "aria-hidden": "true" }),
        ],
      );
    };
  },
});
