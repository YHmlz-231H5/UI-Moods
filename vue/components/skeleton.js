// ui-moods · Skeleton
//
// The default width is the container's own width, so it needs no inline
// style — and leaving it out is what keeps the round shape round. The
// placeholder is not content, so it is hidden from the screen reader.
//
// While something is loading the placeholder stands in for the content. Once
// nothing is loading, the content takes its place: the placeholder is not
// drawn at all, so the page does not carry a shape that is no longer true.

import { defineComponent, Fragment, h } from "vue";

/** The placeholder shapes the stylesheet draws. */
const SHAPES = ["text", "circle", "block"];

export const UMSkeleton = defineComponent({
  name: "UMSkeleton",
  example: "shapes",
  props: {
    shape: { type: String, default: "text" },
    variant: { type: String, default: "" },
    animated: { type: Boolean, default: false },
    loading: { type: Boolean, default: true },
    width: { type: Number, default: 100 },
  },
  setup(props, { slots }) {
    return () => {
      // Element Plus calls the shape the variant; the library calls it the
      // shape. The variant wins when it names a shape the sheet draws.
      const shape = SHAPES.includes(props.variant)
        ? props.variant
        : SHAPES.includes(props.shape)
          ? props.shape
          : "text";

      const placeholder = {
        class: [
          "um-skeleton",
          `um-skeleton--${shape}`,
          props.animated ? "um-skeleton--animated" : null,
        ],
        hidden: !props.loading,
        "aria-hidden": "true",
      };
      // The default width is the container's own width, so it needs no
      // inline style — and leaving it out is what keeps the round shape
      // round.
      if (props.width !== 100) placeholder.style = { width: `${props.width}%` };

      // The placeholder and the content are siblings: whichever one is not in
      // force is hidden rather than removed, so the box the content takes
      // over is the box the placeholder was standing in.
      return h(Fragment, [
        h("div", placeholder),
        h(
          "div",
          { class: "um-skeleton__content", hidden: props.loading },
          slots.default ? slots.default() : [],
        ),
      ]);
    };
  },
});
