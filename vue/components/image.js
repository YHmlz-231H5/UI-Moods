// ui-moods · Image
//
// The frame holds the space the picture will take, so the wrapper draws the
// frame, the picture and the caption, and the picture is always there — an
// <img> with no source is still an <img> — so the stylesheet can decide
// whether the placeholder stands in for it. The picture that failed is taken
// out of the frame by a class the caller puts on it.
//
// The picture is the caller's: the wrapper takes the source and the alt text
// and puts them on the <img>, so the reader gets the text when the picture is
// the content and nothing when it is only decoration.

import { defineComponent, h } from "vue";

export const UMImage = defineComponent({
  name: "UMImage",
  example: "picture",
  props: {
    src: { type: String, default: "" },
    alt: { type: String, default: "" },
    caption: { type: String, default: "" },
    fit: { type: String, default: "cover" },
    shape: { type: String, default: "square" },
    bordered: { type: Boolean, default: false },
    error: { type: Boolean, default: false },
    size: { type: String, default: "md" },
  },
  setup(props) {
    return () =>
      h(
        "figure",
        {
          class: [
            "um-image",
            props.fit === "contain"
              ? "um-image--contain"
              : props.fit === "fill"
                ? "um-image--fill"
                : props.fit === "cover"
                  ? "um-image--cover"
                  : null,
            props.shape === "rounded"
              ? "um-image--rounded"
              : props.shape === "circle"
                ? "um-image--circle"
                : null,
            props.bordered ? "um-image--bordered" : null,
            props.size === "sm"
              ? "um-image--sm"
              : props.size === "lg"
                ? "um-image--lg"
                : null,
          ],
        },
        [
          h("div", { class: "um-image__frame" }, [
            h("img", {
              class: props.error ? "um-image__image um-image__image--error" : "um-image__image",
              src: props.src || undefined,
              alt: props.alt,
            }),
            h("span", { class: "um-image__placeholder", "aria-hidden": "true" }),
          ]),
          h("figcaption", { class: "um-image__caption" }, props.caption),
        ],
      );
  },
});
