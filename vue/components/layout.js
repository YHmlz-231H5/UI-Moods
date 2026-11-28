// ui-moods · Layout
//
// The parts are the landmarks: a header, an aside, a main and a footer. The
// wrapper keeps the order the page skeleton is read in — header, then the
// column and the content, then the footer — and the direction prop decides
// whether the column stands beside the content or above it.

import { defineComponent, h } from "vue";

export const UMLayout = defineComponent({
  name: "UMLayout",
  example: "horizontal",
  props: {
    direction: { type: String, default: "horizontal" },
    size: { type: String, default: "md" },
    align: { type: String, default: "stretch" },
    pull: { type: Number, default: 0 },
    push: { type: Number, default: 0 },
  },
  setup(props, { slots }) {
    return () =>
      h(
        "div",
        {
          class: [
            "um-layout",
            props.direction === "stacked" ? "um-layout--stacked" : null,
            props.size !== "md" ? `um-layout--${props.size}` : null,
            // The stretched row is the base class on its own.
            props.align !== "stretch" ? `um-layout--align-${props.align}` : null,
            // The offsets: the class says that the layout is moved at all, and
            // the number travels as the custom property the stylesheet reads.
            props.pull > 0 ? "um-layout--pull" : null,
            props.push > 0 ? "um-layout--push" : null,
          ],
          style: {
            "--um-layout-pull": steps(props.pull),
            "--um-layout-push": steps(props.push),
          },
        },
        [
          h("header", { class: "um-layout__header" }, slots.header ? slots.header() : []),
          h("div", { class: "um-layout__body" }, [
            h("aside", { class: "um-layout__aside" }, slots.aside ? slots.aside() : []),
            h("main", { class: "um-layout__main" }, slots.default ? slots.default() : []),
          ]),
          h("footer", { class: "um-layout__footer" }, slots.footer ? slots.footer() : []),
        ],
      );
  },
});

/**
 * How far the layout is moved, in steps of the mood's own spacing.
 *
 * The number is a count of spacing steps and not a length, so the measure is
 * the theme's and the offset is the same in every mood.
 */
function steps(count) {
  if (!count) return "0";
  return `calc(var(--um-space-sm) * ${count})`;
}
