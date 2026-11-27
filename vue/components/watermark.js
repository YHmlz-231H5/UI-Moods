// ui-moods · Watermark
//
// The tiles are written out in the markup, because a gradient paints bands
// and not glyphs, and a word baked into an SVG would need a font the library
// does not ship. The wrapper writes the rows and the columns the caller asks
// for; the layer flows them into a lattice, so the tiles wrap with the width
// of the box rather than standing in a fixed grid.

import { defineComponent, h } from "vue";

export const UMWatermark = defineComponent({
  name: "UMWatermark",
  example: "basic",
  props: {
    text: { type: String, default: "Confidential" },
    rows: { type: Number, default: 3 },
    columns: { type: Number, default: 3 },
    variant: { type: String, default: "diagonal" },
    size: { type: String, default: "md" },
  },
  setup(props, { slots }) {
    return () => {
      const tiles = [];
      const count = Math.max(0, Math.round(props.rows) * Math.round(props.columns));

      for (let at = 0; at < count; at += 1) {
        tiles.push(h("span", { class: "um-watermark__text" }, props.text));
      }

      return h(
        "div",
        {
          class: [
            "um-watermark",
            props.variant === "upright" ? "um-watermark--upright" : "um-watermark--diagonal",
            props.size === "sm" ? "um-watermark--sm" : props.size === "lg" ? "um-watermark--lg" : null,
          ],
        },
        [
          // The word repeats what the content already says, so the layer is
          // hidden from the reader and takes no pointer.
          h("div", { class: "um-watermark__layer", "aria-hidden": "true" }, tiles),
          h("div", { class: "um-watermark__content" }, slots.default ? slots.default() : []),
        ],
      );
    };
  },
});
