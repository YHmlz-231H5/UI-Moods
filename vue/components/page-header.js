// ui-moods · PageHeader
//
// The header is a band, and the wrapper builds it out of three things: the
// heading and its line on one side, the actions on the other. The heading's
// level is a prop rather than a constant, because the class sets the size
// and the page — not the component — knows where in the outline it sits.
//
// The breadcrumb and the main content are parts of their own, and they are
// always rendered: a part that is documented but never drawn is a part
// nobody can use. A part that carries nothing is hidden rather than left as
// an empty block.

import { defineComponent, h } from "vue";

export const UMPageHeader = defineComponent({
  name: "UMPageHeader",
  example: "basic",
  props: {
    title: { type: String, default: "" },
    subtitle: { type: String, default: "" },
    level: { type: String, default: "1" },
    variant: { type: String, default: "plain" },
  },
  setup(props, { slots }) {
    return () => {
      const breadcrumb = slots.breadcrumb ? slots.breadcrumb() : [];
      const main = slots.default ? slots.default() : [];

      return h(
        "header",
        {
          class: [
            "um-page-header",
            props.variant === "bordered" ? "um-page-header--bordered" : null,
          ],
        },
        [
          h("div", { class: "um-page-header__content" }, [
            h("div", { class: "um-page-header__breadcrumb", hidden: !hasContent(breadcrumb) }, breadcrumb),
            h(
              `h${props.level}`,
              { class: "um-page-header__title" },
              slots.title ? slots.title() : props.title,
            ),
            h(
              "p",
              { class: "um-page-header__subtitle" },
              slots.content ? slots.content() : slots.subtitle ? slots.subtitle() : props.subtitle,
            ),
            h("div", { class: "um-page-header__main", hidden: !hasContent(main) }, main),
          ]),
          h(
            "div",
            { class: "um-page-header__actions" },
            slots.extra ? slots.extra() : slots.actions ? slots.actions() : [],
          ),
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
