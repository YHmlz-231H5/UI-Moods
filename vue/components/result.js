// ui-moods · Result
//
// The end of a flow: one statement of what happened, a line of explanation and
// the way out. The icon slot ships empty — the library draws the plate and
// stops there — and the parts that carry nothing are hidden rather than left
// as an empty heading in the document outline.

import { defineComponent, h } from "vue";

/** The tones the plate behind the icon can take. */
const VARIANTS = ["success", "warning", "danger", "info"];

export const UMResult = defineComponent({
  name: "UMResult",
  example: "result",
  props: {
    variant: { type: String, default: "" },
    title: { type: String, default: "" },
    subtitle: { type: String, default: "" },
  },
  setup(props, { slots }) {
    return () => {
      const title = slots.title ? slots.title({ title: props.title }) : props.title;
      // Element Plus calls this slot `sub-title`; the library calls it
      // `subtitle`. Both fill the same part, and the longer name wins when a
      // host uses both.
      const subtitle = slots["sub-title"]
        ? slots["sub-title"]({ subtitle: props.subtitle })
        : slots.subtitle
          ? slots.subtitle({ subtitle: props.subtitle })
          : props.subtitle;
      const extra = slots.extra ? slots.extra() : [];

      return h(
        "div",
        { class: ["um-result", VARIANTS.includes(props.variant) ? `um-result--${props.variant}` : null] },
        [
          h("span", { class: "um-result__icon", "aria-hidden": "true" }, slots.icon ? slots.icon() : []),
          h("h2", { class: "um-result__title", hidden: !hasContent(title) }, title),
          h("p", { class: "um-result__subtitle", hidden: !hasContent(subtitle) }, subtitle),
          h(
            "div",
            {
              class: "um-result__extra",
              // The stylesheet gives the actions area a flex box of its own,
              // so the hidden attribute would not take it out of the flow.
              style: hasContent(extra) ? null : { display: "none" },
            },
            extra,
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
