// ui-moods · Message Box
//
// The box is a <dialog> and the form around it has method="dialog", so the
// browser's own close is the one that closes it: every button is a submit,
// and submitting is the browser's way of closing a dialog. The wrapper
// installs no listener and handles no key.
//
// The title and the message each get an id of their own, because the box
// names itself with aria-labelledby and aria-describedby and two boxes on one
// page may not share an id.
//
// The value on each button is the answer the host reads back from the
// dialog's returnValue: "confirm", "cancel" or "close".

import { defineComponent, h, useId } from "vue";

export const UMMessageBox = defineComponent({
  name: "UMMessageBox",
  example: "basic",
  props: {
    type: { type: String, default: "info" },
    size: { type: String, default: "md" },
    title: { type: String, default: "" },
    confirmText: { type: String, default: "确定" },
    cancelText: { type: String, default: "取消" },
    showClose: { type: Boolean, default: true },
    showCancel: { type: Boolean, default: true },
  },
  setup(props, { slots }) {
    const titleId = `um-message-box-title-${useId()}`;
    const contentId = `um-message-box-content-${useId()}`;

    return () =>
      h(
        "dialog",
        {
          open: true,
          class: [
            "um-message-box",
            `um-message-box--${props.type}`,
            props.size !== "md" ? `um-message-box--${props.size}` : null,
          ],
          "aria-labelledby": titleId,
          "aria-describedby": contentId,
        },
        [
          h("form", { method: "dialog" }, [
            // The icon repeats what the type already says, so it is hidden
            // from the reader.
            h("span", { class: "um-message-box__icon", "aria-hidden": "true" }),
            h("h2", { class: "um-message-box__title", id: titleId }, props.title),
            h(
              "div",
              { class: "um-message-box__content", id: contentId },
              slots.default ? slots.default() : [],
            ),
            props.showClose
              ? h("button", {
                  class: "um-message-box__close",
                  type: "submit",
                  value: "close",
                  "aria-label": "Close",
                })
              : null,
            h("div", { class: "um-message-box__actions" }, [
              props.showCancel
                ? h(
                    "button",
                    {
                      class: "um-message-box__cancel",
                      type: "submit",
                      value: "cancel",
                    },
                    props.cancelText,
                  )
                : null,
              h(
                "button",
                {
                  class: "um-message-box__confirm",
                  type: "submit",
                  value: "confirm",
                },
                props.confirmText,
              ),
            ]),
          ]),
        ],
      );
  },
});
