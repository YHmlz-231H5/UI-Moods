// ui-moods · Dialog
//
// The panel is a <dialog> and the close button is a submit button inside a
// form whose method is dialog: submitting it is the browser's own way of
// closing a dialog, so the wrapper installs no listener and the component
// carries no JavaScript at all. The title gets an id of its own, because the
// dialog names itself with aria-labelledby and two dialogs on one page may
// not share an id.

import { defineComponent, h, useId } from "vue";

export const UMDialog = defineComponent({
  name: "UMDialog",
  example: "basic",
  props: {
    title: { type: String, default: "" },
    align: { type: String, default: "start" },
    size: { type: String, default: "md" },
  },
  setup(props, { slots }) {
    const titleId = `um-dialog-title-${useId()}`;

    return () =>
      h(
        "dialog",
        {
          open: true,
          class: [
            "um-dialog",
            props.align === "center" ? "um-dialog--center" : null,
            props.size !== "md" ? `um-dialog--${props.size}` : null,
          ],
          "aria-labelledby": titleId,
        },
        [
          h("form", { method: "dialog", class: "um-dialog__form" }, [
            h("div", { class: "um-dialog__header" }, [
              h(
                "h2",
                { class: "um-dialog__title", id: titleId },
                slots.title ? slots.title() : props.title,
              ),
              h("button", {
                class: "um-dialog__close",
                type: "submit",
                "aria-label": "Close",
              }),
            ]),
            h("div", { class: "um-dialog__body" }, slots.default ? slots.default() : []),
            h("div", { class: "um-dialog__footer" }, [
              ...(slots.actions
                ? slots.actions()
                : [h("button", { class: "um-dialog__action", type: "button" }, "Confirm")]),
            ]),
          ]),
        ],
      );
  },
});
