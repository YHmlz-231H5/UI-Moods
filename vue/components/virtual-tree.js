// ui-moods · Virtual Tree
//
// A branch is a disclosure, not a menu: the browser owns the open state, so
// the branch stays open across a reload and the reader gets the collapsed and
// expanded announcement for free.
//
// The wrapper writes the tree the depth and the branching factor describe —
// four levels of six is more than a thousand leaves — and the stylesheet does
// the rest: the level below a branch far from the viewport is not laid out.

import { defineComponent, h } from "vue";

/** The variants the stylesheet paints. */
const VARIANTS = ["plain", "lines"];

/**
 * One level of branches.
 *
 * The name is the path to the node, so a reader who is told where they are
 * can be told where they are in the tree. Every level but the last is open,
 * so the tree shows its shape without a thousand open disclosures.
 */
function buildLevel(level, depth, branches, path) {
  return Array.from({ length: branches }, (_, index) => {
    const name = `${path}.${index + 1}`;
    const children =
      level < depth ? buildLevel(level + 1, depth, branches, name) : [];
    return h(
      "details",
      { class: "um-virtual-tree__node", open: level < depth },
      [
        h("summary", { class: "um-virtual-tree__label" }, [
          h("span", { class: "um-virtual-tree__arrow", "aria-hidden": "true" }),
          h("span", { class: "um-virtual-tree__text" }, name),
        ]),
        h("div", { class: "um-virtual-tree__children" }, children),
      ],
    );
  });
}

export const UMVirtualTree = defineComponent({
  name: "UMVirtualTree",
  example: "plain",
  props: {
    variant: { type: String, default: "plain" },
    size: { type: String, default: "md" },
    depth: { type: Number, default: 4 },
    branches: { type: Number, default: 6 },
    height: { type: String, default: "16em" },
  },
  setup(props) {
    return () => {
      const depth = Math.max(1, Math.floor(props.depth));
      const branches = Math.max(1, Math.floor(props.branches));

      return h(
        "div",
        {
          class: [
            "um-virtual-tree",
            VARIANTS.includes(props.variant) ? `um-virtual-tree--${props.variant}` : null,
            sizeClass(props.size),
          ],
        },
        [
        h(
          "div",
          {
            class: "um-virtual-tree__scroller",
            tabindex: "0",
            style: { height: props.height },
          },
          [
            h(
              "div",
              { class: "um-virtual-tree__tree", role: "group", "aria-label": "Project files" },
              buildLevel(1, depth, branches, "branch"),
            ),
          ],
        ),
      ]);
    };
  },
});

/** The medium size is the base class on its own. */
function sizeClass(size) {
  if (size === "sm") return "um-virtual-tree--sm";
  if (size === "lg") return "um-virtual-tree--lg";
  return null;
}
