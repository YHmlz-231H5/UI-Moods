// ui-moods · Transfer
//
// The whole thing is a form: the move buttons are real submit buttons that
// carry their direction in their value, and the ticked options are the form's
// own fields, so the host that receives the post does the moving. The library
// draws the panels, the rows and the arrows; the box inside an option belongs
// to the checkbox component, so the options in the two panels are the
// caller's, and the source and target slots are where they go.
//
// The count in each header is worked out from the two panels, because the
// manifest's own example counts them that way: three of five available, two
// of five chosen.
//
// The filter field and the empty message are in the markup either way: the
// classes on the transfer say which of them are on the page.

import { defineComponent, h } from "vue";
import { modelValue } from "../lib/model.mjs";

export const UMTransfer = defineComponent({
  name: "UMTransfer",
  example: "horizontal",
  props: {
    name: { type: String, default: "" },
    value: { type: String, default: "" },
    modelValue: { type: String, default: undefined },
    checked: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    direction: { type: String, default: "horizontal" },
    size: { type: String, default: "md" },
    filterable: { type: Boolean, default: false },
    virtualScroll: { type: Boolean, default: false },
  },
  emits: ["change", "submit"],
  setup(props, { slots, emit }) {
    return () => {
      // The two panels submit under different names, so the host can tell
      // the options apart.
      const base = props.name || "um-transfer";

      const source = slots.source ? slots.source() : [];
      const target = slots.target ? slots.target() : [];
      // The default slot is the name Element Plus gives the same content the
      // source slot fills.
      const left = slots.default ? slots.default() : source;
      const right = target;
      // A panel that says what it holds when it is empty is an empty panel;
      // one that says nothing keeps the wrapper's own row.
      const sourceRows = left.length ? left : slots["left-empty"] ? [] : [null];
      const targetRows = right.length ? right : slots["right-empty"] ? [] : [null];
      const total = sourceRows.length + targetRows.length;

      const panel = (title, rows, listName, footer, empty, emptySlot) =>
        h("section", { class: "um-transfer__panel" }, [
          h("header", { class: "um-transfer__header" }, [
            h("span", { class: "um-transfer__title" }, title),
            h("span", { class: "um-transfer__count" }, `${rows.length} / ${total}`),
          ]),
          h("input", {
            class: "um-transfer__filter",
            type: "search",
            "aria-label": `Filter ${title}`,
          }),
          h(
            "ul",
            {
              class: "um-transfer__list",
              // The change event bubbles out of the input, so the handler sits
              // on the list: it fires for the caller's options and for the
              // wrapper's alike.
              onChange: (e) => emit("change", e),
            },
            rows.map((row) =>
              row
                ? row
                : h("li", { class: "um-transfer__item" }, [
                    h("label", { class: "um-transfer__option" }, [
                      h("input", {
                        type: "checkbox",
                        name: listName,
                        value: modelValue(props, props.value) || undefined,
                        checked: props.checked,
                        disabled: props.disabled,
                      }),
                      // The panel owns no text of its own, so an option that
                      // was not given one shows what it submits.
                      h("span", { class: "um-transfer__text" }, modelValue(props, props.value)),
                    ]),
                  ]),
            ),
          ),
          h("div", { class: `um-transfer__${empty}` }, emptySlot ? emptySlot() : []),
          // The footer is under the list. It is in the markup either way, and
          // an empty one takes no room.
          h("div", { class: "um-transfer__footer" }, footer ? footer() : []),
        ]);

      return h(
        "form",
        {
          class: [
            "um-transfer",
            props.direction === "vertical" ? "um-transfer--vertical" : null,
            props.size === "sm"
              ? "um-transfer--sm"
              : props.size === "lg"
                ? "um-transfer--lg"
                : null,
            props.filterable ? "um-transfer--filterable" : null,
            props.virtualScroll ? "um-transfer--virtual-scroll" : null,
          ],
          method: "post",
          onSubmit: (e) => emit("submit", e),
        },
        [
          panel(
            "Available",
            sourceRows,
            `${base}-source`,
            slots["left-footer"],
            "left-empty",
            slots["left-empty"],
          ),
          h("div", { class: "um-transfer__controls" }, [
            h("button", {
              class: "um-transfer__move",
              type: "submit",
              name: "move",
              value: "to-target",
              "aria-label": "Move to the chosen list",
              disabled: props.disabled,
            }),
            h("button", {
              class: "um-transfer__move-back",
              type: "submit",
              name: "move",
              value: "to-source",
              "aria-label": "Move back to the available list",
              disabled: props.disabled,
            }),
          ]),
          panel(
            "Chosen",
            targetRows,
            `${base}-target`,
            slots["right-footer"],
            "right-empty",
            slots["right-empty"],
          ),
        ],
      );
    };
  },
});
