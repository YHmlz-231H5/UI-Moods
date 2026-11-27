// ui-moods · Divider
//
// The divider draws its two rules with pseudo-elements, so the label in the
// middle is ordinary content — the default slot — and the vertical form
// needs a flex parent, which is the caller's layout to provide.
//
// The line style and the place of the label are classes: the rule can be
// solid, dashed or dotted, and the label can sit in the middle, at the start
// or at the end.

import { defineComponent, h } from "vue";

export const UMDivider = defineComponent({
  name: "UMDivider",
  example: "horizontal",
  props: {
    variant: { type: String, default: "" },
    borderStyle: { type: String, default: "solid" },
    contentPosition: { type: String, default: "center" },
  },
  setup(props, { slots }) {
    return () =>
      h(
        "div",
        {
          class: classes(props),
          role: "separator",
          "aria-orientation": props.variant === "vertical" ? "vertical" : undefined,
        },
        slots.default ? slots.default() : [],
      );
  },
});

/**
 * The classes the props ask for.
 *
 * A line style can be asked for twice — once by name, once by the prop that
 * means the same thing — and the class is written once either way.
 */
function classes(props) {
  const out = new Set(["um-divider"]);

  if (props.variant) out.add(`um-divider--${props.variant}`);
  if (props.borderStyle && props.borderStyle !== "solid") {
    out.add(`um-divider--${props.borderStyle}`);
  }
  if (props.contentPosition === "start") out.add("um-divider--content-start");
  if (props.contentPosition === "end") out.add("um-divider--content-end");

  return [...out];
}
