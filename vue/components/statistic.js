// ui-moods · Statistic
//
// One number with the name of what it counts. The prefix and the suffix are
// the parts that sit beside the number, and they are hidden when they carry
// nothing — the content box is a flex row, so an empty part would still
// count as a gap.

import { defineComponent, h } from "vue";

/** The tones the number can report; without one it is the ordinary text. */
const VARIANTS = ["success", "warning", "danger"];

export const UMStatistic = defineComponent({
  name: "UMStatistic",
  example: "statistic",
  props: {
    variant: { type: String, default: "" },
    title: { type: String, default: "" },
    value: { type: String, default: "" },
  },
  setup(props, { slots }) {
    return () => {
      const prefix = slots.prefix ? slots.prefix({ value: props.value }) : [];
      const suffix = slots.suffix ? slots.suffix({ value: props.value }) : [];

      return h(
        "div",
        {
          class: [
            "um-statistic",
            VARIANTS.includes(props.variant) ? `um-statistic--${props.variant}` : null,
          ],
        },
        [
          h(
            "span",
            { class: "um-statistic__title" },
            slots.title ? slots.title({ title: props.title }) : props.title,
          ),
          h("span", { class: "um-statistic__content" }, [
            h("span", { class: "um-statistic__prefix", hidden: !hasContent(prefix) }, prefix),
            h(
              "span",
              { class: "um-statistic__value" },
              slots.value ? slots.value({ value: props.value }) : props.value,
            ),
            h("span", { class: "um-statistic__suffix", hidden: !hasContent(suffix) }, suffix),
          ]),
        ],
      );
    };
  },
});

/** Whether a slot or a prop carries anything at all. */
function hasContent(content) {
  if (typeof content === "string") return content !== "";
  if (Array.isArray(content)) return content.length > 0;
  return Boolean(content);
}
