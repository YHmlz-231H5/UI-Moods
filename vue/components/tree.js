// ui-moods · Tree
//
// A branch is a disclosure, not a menu: the browser owns the open state, so
// the branch stays open across a reload and the reader gets the collapsed and
// expanded announcement for free. The open prop is the native open attribute
// on the details, and the toggle event is the browser's own.
//
// The wrapper draws one branch — the node, its label, the mark that says it
// holds something and the level below — and the children slot is where the
// level below goes, written as the node markup the example shows.
//
// The default slot is the label slot under the name Element Plus gives it, and
// the empty slot says what the level below says when there is nothing in it.
//
// The tick box is a real checkbox in front of the branch, so the choice is
// the browser's and not a class. It sits inside the summary, so the wrapper
// stops the click there: otherwise ticking the box would open the branch as
// well.

import { defineComponent, h } from "vue";

export const UMTree = defineComponent({
  name: "UMTree",
  example: "plain",
  props: {
    open: { type: Boolean, default: false },
    variant: { type: String, default: "plain" },
    size: { type: String, default: "md" },
    label: { type: String, default: "" },
    highlightCurrent: { type: Boolean, default: false },
    accordion: { type: Boolean, default: false },
    autoExpandParent: { type: Boolean, default: false },
    checkStrictly: { type: Boolean, default: false },
    defaultExpandAll: { type: Boolean, default: false },
    showCheckbox: { type: Boolean, default: false },
  },
  emits: ["toggle", "check"],
  setup(props, { slots, emit }) {
    return () => {
      // What the branch says. The named slot says it first, and the default
      // slot is the same content under the name Element Plus gives it.
      const row = slots.label
        ? slots.label({ label: props.label, open: props.open })
        : slots.default
          ? slots.default({ label: props.label, open: props.open })
          : [
              h("span", { class: "um-tree__arrow", "aria-hidden": "true" }),
              h("span", { class: "um-tree__text" }, props.label),
            ];

      return h(
        "div",
        {
          class: [
            "um-tree",
            props.variant === "lines"
              ? "um-tree--lines"
              : props.variant === "plain"
                ? "um-tree--plain"
                : null,
            props.size === "sm"
              ? "um-tree--sm"
              : props.size === "lg"
                ? "um-tree--lg"
                : null,
            props.highlightCurrent ? "um-tree--highlight-current" : null,
            props.accordion ? "um-tree--accordion" : null,
            props.autoExpandParent ? "um-tree--auto-expand-parent" : null,
            props.checkStrictly ? "um-tree--check-strictly" : null,
            props.defaultExpandAll ? "um-tree--default-expand-all" : null,
            props.showCheckbox ? "um-tree--show-checkbox" : null,
          ],
          role: "group",
        },
        [
          h(
            "details",
            {
              class: "um-tree__node",
              open: props.open,
              onToggle: (e) => emit("toggle", e),
            },
            [
              h("summary", { class: "um-tree__label" }, [
                props.showCheckbox
                  ? h(
                      "label",
                      {
                        class: "um-tree__box",
                        // The box sits inside the summary, so the click is
                        // stopped here: ticking the box should not open the
                        // branch as well.
                        onClick: (e) => e.stopPropagation(),
                      },
                      [
                        h("input", {
                          class: "um-tree__checkbox",
                          type: "checkbox",
                          onChange: (e) => emit("check", e),
                        }),
                      ],
                    )
                  : null,
                ...(Array.isArray(row) ? row : [row]),
              ]),
              h(
                "div",
                { class: "um-tree__children" },
                slots.children
                  ? slots.children({ label: props.label, open: props.open })
                  : slots.empty
                    ? slots.empty({ label: props.label, open: props.open })
                    : [],
              ),
            ],
          ),
        ],
      );
    };
  },
});
