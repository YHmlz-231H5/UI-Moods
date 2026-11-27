// ui-moods · Timeline
//
// The tone belongs to the entry rather than to the list, so the modifier hangs
// off the item: the wrapper owns the entry the `variant` and `timestamp`
// props describe, and the caller's default slot adds the entries that came
// with their own tone. The rail is drawn by the tail, and the stylesheet
// hides it on the last entry.

import { defineComponent, h } from "vue";

/** The tones an entry can take; without one the dot is the brand colour. */
const VARIANTS = ["success", "warning", "danger"];

/** The sizes the node can take; the medium one is the base class. */
const SIZES = ["sm", "md", "lg"];

/** The ways the rail can sit in relation to the text. */
const MODES = ["start", "end", "alternate", "alternate-reverse"];

export const UMTimeline = defineComponent({
  name: "UMTimeline",
  example: "timeline",
  props: {
    variant: { type: String, default: "" },
    timestamp: { type: String, default: "" },
    reverse: { type: Boolean, default: false },
    mode: { type: String, default: "start" },
    center: { type: Boolean, default: false },
    hollow: { type: Boolean, default: false },
    hideTimestamp: { type: Boolean, default: false },
    size: { type: String, default: "md" },
  },
  setup(props, { slots }) {
    return () => {
      const entries = slots.default ? slots.default() : [];
      return h(
        "ol",
        {
          class: [
            "um-timeline",
            props.reverse ? "um-timeline--reverse" : null,
            // The start run is the base class; the modifier would only
            // repeat it.
            MODES.includes(props.mode) && props.mode !== "start"
              ? `um-timeline--mode-${props.mode}`
              : null,
          ],
        },
        [
          ...entries,
          h(
            "li",
            {
              class: [
                "um-timeline__item",
                VARIANTS.includes(props.variant) ? `um-timeline__item--${props.variant}` : null,
                props.center ? "um-timeline__item--center" : null,
                props.hollow ? "um-timeline__item--hollow" : null,
                props.hideTimestamp ? "um-timeline__item--hide-timestamp" : null,
                SIZES.includes(props.size) && props.size !== "md"
                  ? `um-timeline__item--${props.size}`
                  : null,
              ],
            },
            [
              h(
                "span",
                { class: "um-timeline__node", "aria-hidden": "true" },
                slots.dot ? slots.dot() : [],
              ),
              h("span", { class: "um-timeline__tail", "aria-hidden": "true" }),
              h("div", { class: "um-timeline__wrapper" }, [
                props.timestamp && !props.hideTimestamp
                  ? h("time", { datetime: machineTime(props.timestamp) }, props.timestamp)
                  : null,
                slots.wrapper
                  ? slots.wrapper({ timestamp: props.timestamp, variant: props.variant })
                  : [],
              ]),
            ],
          ),
        ],
      );
    };
  },
});

/**
 * The machine-readable form of a timestamp.
 *
 * The written time and the machine-readable one travel together in the `time`
 * element, so the attribute is only written when the value is one the
 * browser can read.
 */
function machineTime(timestamp) {
  return /^\d{4}-\d{2}-\d{2}/.test(timestamp) ? timestamp : undefined;
}
