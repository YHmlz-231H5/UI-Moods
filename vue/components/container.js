// ui-moods · Container
//
// The width tier is a size modifier, and the middle one is the base class
// itself. The centring is a toggle rather than a size, so it is a boolean:
// the container is centred until the page says otherwise.

import { defineComponent, h } from "vue";

export const UMContainer = defineComponent({
  name: "UMContainer",
  example: "widths",
  props: {
    size: { type: String, default: "md" },
    centered: { type: Boolean, default: true },
  },
  setup(props, { slots }) {
    return () =>
      h(
        "div",
        {
          class: [
            "um-container",
            props.size !== "md" ? `um-container--${props.size}` : null,
            props.centered ? null : "um-container--left",
          ],
        },
        slots.default ? slots.default() : [],
      );
  },
});
