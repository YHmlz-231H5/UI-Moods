// ui-moods · Text
//
// The inline text atom: a colour, a size and the words. The wrapper picks the
// element, because the element is the host's to choose — a run that reads as a
// heading has to be marked up as a heading, and only the host knows which
// level it is.
//
// The size modifier is left off for the default size, because the stylesheet
// says the middle size needs no class.

import { defineComponent, h } from "vue";

/** The elements a run may be written as. */
const TAGS = ["span", "div", "p"];

export const UMText = defineComponent({
  name: "UMText",
  example: "types",
  props: {
    type: { type: String, default: "regular" },
    size: { type: String, default: "md" },
    truncate: { type: Boolean, default: false },
    truncated: { type: Boolean, default: false },
    lineClamp: { type: Number, default: undefined },
    tag: { type: String, default: "span" },
  },
  setup(props, { slots }) {
    return () => {
      const clamped = props.lineClamp !== undefined && props.lineClamp !== null;
      return h(
        TAGS.includes(props.tag) ? props.tag : "span",
        {
          class: [
            "um-text",
            `um-text--${props.type}`,
            props.size !== "md" ? `um-text--${props.size}` : null,
            props.truncate || props.truncated ? "um-text--truncate" : null,
            clamped ? "um-text--clamp" : null,
          ],
          // The number of lines is the host's, so it comes with the run. The
          // class only says that the run is clamped.
          style: clamped ? { "-webkit-line-clamp": String(props.lineClamp) } : undefined,
        },
        slots.default ? slots.default() : [],
      );
    };
  },
});
