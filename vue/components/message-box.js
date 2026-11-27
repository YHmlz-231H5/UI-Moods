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
//
// The shape of the box is decided by the kind of box it is: an alert asks
// for one answer, a confirm for two, and a prompt for two and a field to
// type in. The individual switches say the same thing one button at a time,
// and the kind of box has the last word on the cancel button, because an
// alert has only one answer to give.

import { defineComponent, h, onMounted, ref, useId } from "vue";

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
    showCancelButton: { type: Boolean, default: true },
    showConfirmButton: { type: Boolean, default: true },
    showInput: { type: Boolean, default: false },
    boxType: { type: String, default: "confirm" },
    center: { type: Boolean, default: false },
    roundButton: { type: Boolean, default: false },
    buttonSize: { type: String, default: "md" },
    modal: { type: Boolean, default: false },
    confirmButtonType: { type: String, default: "default" },
    cancelButtonType: { type: String, default: "default" },
  },
  setup(props, { slots }) {
    const titleId = `um-message-box-title-${useId()}`;
    const contentId = `um-message-box-content-${useId()}`;
    const panel = ref(null);

    // The modal box is opened by the browser, not by the markup: the open
    // attribute is left off, because showModal() refuses a dialog that
    // already carries one.
    onMounted(() => {
      if (props.modal && panel.value?.showModal) {
        panel.value.showModal();
      }
    });

    return () => {
      // An alert has one answer to give, so it has no cancel button.
      const cancel = props.showCancel && props.showCancelButton && props.boxType !== "alert";
      const confirm = props.showConfirmButton;
      const input = props.showInput || props.boxType === "prompt";

      return h(
        "dialog",
        {
          ref: panel,
          open: props.modal ? undefined : true,
          class: [
            "um-message-box",
            `um-message-box--${props.type}`,
            props.size !== "md" ? `um-message-box--${props.size}` : null,
            props.center ? "um-message-box--center" : null,
            props.roundButton ? "um-message-box--round-button" : null,
            props.buttonSize !== "md" ? `um-message-box--button-${props.buttonSize}` : null,
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
              [
                ...(slots.default ? slots.default() : []),
                input
                  ? h("input", {
                      class: "um-message-box__input",
                      type: "text",
                      "aria-label": props.title || undefined,
                    })
                  : null,
              ],
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
              cancel
                ? h(
                    "button",
                    {
                      class: "um-message-box__cancel",
                      type: "submit",
                      value: "cancel",
                      ...(props.cancelButtonType !== "default"
                        ? { "data-um-type": props.cancelButtonType }
                        : {}),
                    },
                    props.cancelText,
                  )
                : null,
              confirm
                ? h(
                    "button",
                    {
                      class: "um-message-box__confirm",
                      type: "submit",
                      value: "confirm",
                      ...(props.confirmButtonType !== "default"
                        ? { "data-um-type": props.confirmButtonType }
                        : {}),
                    },
                    props.confirmText,
                  )
                : null,
            ]),
          ]),
        ],
      );
    };
  },
});
