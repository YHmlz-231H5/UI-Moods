// ui-moods · Popover
//
// The card is a <details>, so the browser owns the open state and the toggle
// event — the wrapper installs no listener of its own. The header, the body
// and the footer are the manifest's slots, and a part that carries nothing is
// hidden rather than left as an empty rule across the card.

import { defineComponent, h } from "vue";

/** The bottom placement is the base class; the other three add a modifier. */
const PLACEMENTS = ["top", "left", "right"];

/** The medium card is the base class; the other two add a modifier. */
const WIDTHS = ["small", "large"];

export const UMPopover = defineComponent({
  name: "UMPopover",
  example: "basic",
  props: {
    placement: { type: String, default: "bottom" },
    width: { type: String, default: "medium" },
    title: { type: String, default: "" },
    disabled: { type: Boolean, default: false },
    enterable: { type: Boolean, default: true },
    visible: { type: Boolean, default: false },
  },
  emits: ["toggle"],
  setup(props, { slots, emit }) {
    return () => {
      const header = slots.header ? slots.header({ title: props.title }) : props.title;
      const body = slots.body ? slots.body() : [];
      const footer = slots.footer ? slots.footer() : [];

      return h(
        "details",
        {
          class: [
            "um-popover",
            PLACEMENTS.includes(props.placement) ? `um-popover--${props.placement}` : null,
            WIDTHS.includes(props.width) ? `um-popover--${props.width}` : null,
            props.disabled ? "um-popover--disabled" : null,
            props.enterable ? null : "um-popover--not-enterable",
          ],
          // The open attribute is the browser's own: the card is open when
          // the host asks for it to be.
          open: props.visible || undefined,
          onToggle: (e) => emit("toggle", e),
        },
        [
          h(
            "summary",
            { class: "um-popover__trigger" },
            slots.reference ? slots.reference() : slots.default ? slots.default() : [],
          ),
          h("div", { class: "um-popover__content" }, [
            h("div", { class: "um-popover__header", hidden: !hasContent(header) }, header),
            h("div", { class: "um-popover__body", hidden: !hasContent(body) }, body),
            h("div", { class: "um-popover__footer", hidden: !hasContent(footer) }, footer),
          ]),
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
