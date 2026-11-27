// ui-moods · Icon
//
// The glyph is a name, and the stylesheet draws it. The icon is hidden from
// the screen reader unless it is given a label — a shape that carries a
// message on its own has to be announced as an image with that message's
// name, and a shape beside a word has nothing to add.

import { defineComponent, h } from "vue";

export const UMIcon = defineComponent({
  name: "UMIcon",
  example: "glyphs",
  props: {
    name: { type: String, default: "check" },
    size: { type: String, default: "md" },
    label: { type: String, default: "" },
  },
  setup(props) {
    return () =>
      h("span", {
        class: [
          "um-icon",
          `um-icon--${props.name}`,
          props.size !== "md" ? `um-icon--${props.size}` : null,
        ],
        role: props.label ? "img" : undefined,
        "aria-hidden": props.label ? undefined : "true",
        "aria-label": props.label || undefined,
      });
  },
});
