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

import { defineComponent, h } from "vue";

export const UMTree = defineComponent({
  name: "UMTree",
  example: "plain",
  props: {
    open: { type: Boolean, default: false },
    variant: { type: String, default: "plain" },
    size: { type: String, default: "md" },
    label: { type: String, default: "" },
  },
  emits: ["toggle"],
  setup(props, { slots, emit }) {
    return () =>
      h(
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
              h(
                "summary",
                { class: "um-tree__label" },
                slots.label
                  ? slots.label({ label: props.label, open: props.open })
                  : [
                      h("span", { class: "um-tree__arrow", "aria-hidden": "true" }),
                      h("span", { class: "um-tree__text" }, props.label),
                    ],
              ),
              h(
                "div",
                { class: "um-tree__children" },
                slots.children ? slots.children({ label: props.label, open: props.open }) : [],
              ),
            ],
          ),
        ],
      );
  },
});
