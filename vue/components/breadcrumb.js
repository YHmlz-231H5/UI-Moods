// ui-moods · Breadcrumb
//
// The manifest describes the trail but gives it no way to say how many steps
// there are, so the steps arrive through the default slot and the wrapper
// builds the shell around them: the <nav>, the <ol>, the separators, and the
// page the reader is on — the one step that is a <span> rather than a link.

import { defineComponent, cloneVNode, h } from "vue";

/**
 * One step of the trail.
 *
 * The host writes the element — an `<a>` for a step the reader can go back
 * to, a `<span>` for the page the reader is on — and the wrapper adds the
 * class the stylesheet paints it with.
 */
function stepLink(step) {
  if (!step) return h("a", { class: "um-breadcrumb__link", href: "#" });
  if (typeof step.type !== "string") {
    return h("span", { class: "um-breadcrumb__link" }, step.children);
  }
  const current = step.type !== "a";
  return cloneVNode(step, {
    class: "um-breadcrumb__link",
    ...(current ? { "aria-current": "page" } : {}),
  });
}

export const UMBreadcrumb = defineComponent({
  name: "UMBreadcrumb",
  example: "basic",
  props: {
    separator: { type: String, default: "chevron" },
    label: { type: String, default: "Breadcrumb" },
  },
  setup(props, { slots }) {
    return () => {
      const steps = slots.default ? slots.default() : [];
      // A trail is at least two steps long: the separator only appears
      // between two of them.
      const trail = steps.length ? steps : [null, null];
      return h(
        "nav",
        {
          class: ["um-breadcrumb", props.separator === "slash" ? "um-breadcrumb--slash" : null],
          "aria-label": props.label,
        },
        [
          h(
            "ol",
            { class: "um-breadcrumb__list" },
            trail.map((step, i) =>
              h("li", { class: "um-breadcrumb__item", key: i }, [
                ...(i > 0
                  ? [h("span", { class: "um-breadcrumb__separator", "aria-hidden": "true" })]
                  : []),
                stepLink(step),
              ]),
            ),
          ),
        ],
      );
    };
  },
});
