// ui-moods · Virtual Tree
//
// A branch is a disclosure, not a menu: the browser owns the open state, so
// the branch stays open across a reload and the reader gets the collapsed and
// expanded announcement for free.
//
// The wrapper writes the tree the depth and the branching factor describe —
// four levels of six is more than a thousand leaves — and the stylesheet does
// the rest: the level below a branch far from the viewport is not laid out.
//
// The default slot says what a branch is called; the empty slot says what the
// tree holds when it holds nothing at all.
//
// The tick box is a real checkbox in front of every branch, so the choice is
// the browser's and not a class. It sits inside the summary, so the wrapper
// stops the click there: otherwise ticking the box would open the branch as
// well.

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
function buildLevel(slots, level, depth, branches, path, options) {
  return Array.from({ length: branches }, (_, index) => {
    const name = `${path}.${index + 1}`;
    const children =
      level < depth ? buildLevel(slots, level + 1, depth, branches, name, options) : [];
    return h(
      "details",
      { class: "um-virtual-tree__node", open: level < depth },
      [
        h("summary", { class: "um-virtual-tree__label" }, [
          options.showCheckbox
            ? h(
                "label",
                {
                  class: "um-virtual-tree__box",
                  // The box sits inside the summary, so the click is stopped
                  // here: ticking the box should not open the branch as well.
                  onClick: (e) => e.stopPropagation(),
                },
                [
                  h("input", {
                    class: "um-virtual-tree__checkbox",
                    type: "checkbox",
                    onChange: (e) => options.emit("check", e),
                  }),
                ],
              )
            : null,
          h("span", { class: "um-virtual-tree__arrow", "aria-hidden": "true" }),
          h(
            "span",
            { class: "um-virtual-tree__text" },
            slots.default ? slots.default({ node: name, level }) : name,
          ),
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
    highlightCurrent: { type: Boolean, default: false },
    scrollbarAlwaysOn: { type: Boolean, default: false },
    checkStrictly: { type: Boolean, default: false },
    showCheckbox: { type: Boolean, default: false },
  },
  emits: ["toggle", "check"],
  setup(props, { slots, emit }) {
    return () => {
      const depth = Math.max(1, Math.floor(props.depth));
      const branches = Math.max(0, Math.floor(props.branches));
      const options = { showCheckbox: props.showCheckbox, emit };

      // No branches at all is an empty tree: there is nothing to read, so the
      // tree says so rather than drawing a level of nothing.
      const tree = branches
        ? buildLevel(slots, 1, depth, branches, "branch", options)
        : [
            h(
              "div",
              { class: "um-virtual-tree__empty" },
              slots.empty ? slots.empty() : "No data",
            ),
          ];

      return h(
        "div",
        {
          class: [
            "um-virtual-tree",
            VARIANTS.includes(props.variant) ? `um-virtual-tree--${props.variant}` : null,
            sizeClass(props.size),
            props.highlightCurrent ? "um-virtual-tree--highlight-current" : null,
            props.scrollbarAlwaysOn ? "um-virtual-tree--scrollbar-always-on" : null,
            props.checkStrictly ? "um-virtual-tree--check-strictly" : null,
            props.showCheckbox ? "um-virtual-tree--show-checkbox" : null,
          ],
        },
        [
        h(
          "div",
          {
            class: "um-virtual-tree__scroller",
      "aria-label": "Scrollable tree",
            tabindex: "0",
            style: { height: props.height },
          },
          [
            h(
              "div",
              { class: "um-virtual-tree__tree", role: "group", "aria-label": "Project files" },
              tree,
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
