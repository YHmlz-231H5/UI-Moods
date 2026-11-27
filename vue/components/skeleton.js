// ui-moods · Skeleton
//
// The default width is the container's own width, so it needs no inline
// style — and leaving it out is what keeps the round shape round. The
// placeholder is not content, so it is hidden from the screen reader.

import { defineComponent, h } from "vue";

export const UMSkeleton = defineComponent({
  name: "UMSkeleton",
  example: "shapes",
  props: {
    shape: { type: String, default: "text" },
    animated: { type: Boolean, default: false },
    width: { type: Number, default: 100 },
  },
  setup(props) {
    return () => {
      const attrs = {
        class: [
          "um-skeleton",
          `um-skeleton--${props.shape}`,
          props.animated ? "um-skeleton--animated" : null,
        ],
        "aria-hidden": "true",
      };
      // The default width is the container's own width, so it needs no
      // inline style — and leaving it out is what keeps the round shape
      // round.
      if (props.width !== 100) attrs.style = { width: `${props.width}%` };
      return h("div", attrs);
    };
  },
});
