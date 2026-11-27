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
// the content and nothing when it is only decoration. A caller who brings a
// picture of its own hands it over in the default slot, and the class goes on
// it here.
//
// The placeholder and the error content are the two things that can stand in
// for a picture. The placeholder is drawn by the stylesheet and carries no
// text of its own; the error content is the caller's, and it is only shown
// when there is something in it.

import { defineComponent, cloneVNode, h } from "vue";

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
    loading: { type: String, default: "eager" },
  },
  setup(props, { slots }) {
    return () => {
      const picture = slots.default ? slots.default() : [];
      const errorContent = slots.error ? slots.error() : [];
      const placeholder = slots.placeholder ? slots.placeholder() : [];

      return h(
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
            // The picture is the caller's own img element; the class is added
            // here so the caller does not have to repeat it.
            picture.length
              ? cloneVNode(picture[0], {
                  class: props.error
                    ? "um-image__image um-image__image--error"
                    : "um-image__image",
                  ...(props.src && !picture[0].props?.src ? { src: props.src } : {}),
                  ...(props.alt && !picture[0].props?.alt ? { alt: props.alt } : {}),
                  ...(picture[0].props?.loading ? {} : { loading: props.loading }),
                })
              : h("img", {
                  class: props.error ? "um-image__image um-image__image--error" : "um-image__image",
                  src: props.src || undefined,
                  alt: props.alt,
                  // The native loading attribute: the browser decides when to
                  // fetch the picture.
                  loading: props.loading,
                }),
            h(
              "span",
              { class: "um-image__error", hidden: !hasContent(errorContent) },
              errorContent,
            ),
            h(
              "span",
              {
                class: "um-image__placeholder",
                // A placeholder the caller filled is content, and the reader
                // is told about it; one the stylesheet drew is not.
                "aria-hidden": hasContent(placeholder) ? undefined : "true",
              },
              placeholder,
            ),
          ]),
          h("figcaption", { class: "um-image__caption" }, props.caption),
        ],
      );
    };
  },
});

/** Whether a slot carries anything at all. */
function hasContent(content) {
  if (typeof content === "string") return content !== "";
  if (Array.isArray(content)) return content.length > 0;
  return Boolean(content);
}
