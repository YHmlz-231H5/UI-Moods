// ui-moods · Splitter
//
// The splitter draws the shape: two panes, a divider and a grip. It does not
// move the divider — there is no JavaScript in the library, so the size of
// the two panes is fixed by the markup, and a host that drags it has to set
// the separator's value for itself.
//
// The fold controls are the host's for the same reason: the library cannot
// fold a pane away, so it holds the space the control sits in and says on
// the divider that a pane can be folded at all.

import { defineComponent, h } from "vue";

export const UMSplitter = defineComponent({
  name: "UMSplitter",
  example: "horizontal",
  props: {
    layout: { type: String, default: "horizontal" },
    size: { type: String, default: "md" },
    collapsible: { type: Boolean, default: false },
  },
  setup(props, { slots }) {
    return () => {
      /** The space the host's own fold control sits in. */
      const fold = (name) =>
        h(
          "span",
          {
            class: "um-splitter__collapse",
            // The stylesheet draws the space as a flex box of its own, so the
            // hidden attribute would not take it out of the flow.
            style: slots[name] ? null : { display: "none" },
          },
          slots[name] ? slots[name]() : [],
        );

      const bar = h(
        "div",
        {
          class: "um-splitter__bar",
      "aria-label": "Splitter handle",
          role: "separator",
          "aria-orientation": props.layout === "vertical" ? "horizontal" : "vertical",
          tabindex: "0",
        },
        [h("span", { class: "um-splitter__handle", "aria-hidden": "true" })],
      );

      // The host may write the whole run itself; then the fold controls
      // belong to that run as well.
      const run = slots.default
        ? slots.default()
        : [
            h("div", { class: "um-splitter__panel" }, [
              slots.start ? slots.start() : [],
              fold("start-collapsible"),
            ]),
            bar,
            h("div", { class: "um-splitter__panel" }, [
              slots.end ? slots.end() : [],
              fold("end-collapsible"),
            ]),
          ];

      return h(
        "div",
        {
          class: [
            "um-splitter",
            `um-splitter--${props.layout}`,
            // The medium size is the base class itself, so it needs no
            // modifier — a class the stylesheet does not have paints nothing.
            props.size !== "md" ? `um-splitter--${props.size}` : null,
            props.collapsible ? "um-splitter--collapsible" : null,
          ],
        },
        run,
      );
    };
  },
});
