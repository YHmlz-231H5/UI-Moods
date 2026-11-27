// ui-moods · Dialog
//
// The panel is a <dialog> and the close button is a submit button inside a
// form whose method is dialog: submitting it is the browser's own way of
// closing a dialog, so the wrapper installs no listener and the component
// carries no JavaScript at all. The title gets an id of its own, because the
// dialog names itself with aria-labelledby and two dialogs on one page may
// not share an id.
//
// The panel answers to `v-model` as well: the browser tells the wrapper when
// the dialog is done, and the wrapper publishes that as the new value.
//
// The modal form is the browser's own. A modal panel is opened with
// showModal(), which puts it in the top layer and gives it the backdrop the
// browser paints for a modal dialog — the library paints no mask of its own.

import { defineComponent, computed, h, onMounted, ref, useId, watch } from "vue";
import { modelValue } from "../lib/model.mjs";

export const UMDialog = defineComponent({
  name: "UMDialog",
  example: "basic",
  props: {
    title: { type: String, default: "" },
    align: { type: String, default: "start" },
    size: { type: String, default: "md" },
    center: { type: Boolean, default: false },
    alignCenter: { type: Boolean, default: false },
    fullscreen: { type: Boolean, default: false },
    modal: { type: Boolean, default: false },
    modelValue: { type: Boolean, default: undefined },
    showClose: { type: Boolean, default: true },
  },
  emits: ["close", "open", "update:modelValue"],
  setup(props, { slots, emit }) {
    const titleId = `um-dialog-title-${useId()}`;
    const panel = ref(null);
    const open = computed(() => modelValue(props, true));

    // The modal panel is opened by the browser, not by the markup: the open
    // attribute is left off, because showModal() refuses a dialog that
    // already carries one.
    onMounted(() => {
      if (props.modal && open.value && panel.value?.showModal) {
        panel.value.showModal();
      }
      if (open.value) emit("open");
    });

    // The host can open the panel again after it was closed.
    watch(open, (isOpen) => {
      if (isOpen) emit("open");
    });

    return () => {
      const centered = props.align === "center" || props.center;

      return h(
        "dialog",
        {
          ref: panel,
          open: props.modal ? undefined : open,
          class: [
            "um-dialog",
            centered ? "um-dialog--center" : null,
            props.size !== "md" ? `um-dialog--${props.size}` : null,
            props.alignCenter ? "um-dialog--align-center" : null,
            props.fullscreen ? "um-dialog--fullscreen" : null,
          ],
          "aria-labelledby": titleId,
          // The browser's own close: it fires when the dialog is done, which
          // is either the close button's submit or the escape key.
          onClose: () => {
            emit("update:modelValue", false);
            emit("close");
          },
        },
        [
          h("form", { method: "dialog", class: "um-dialog__form" }, [
            h("div", { class: "um-dialog__header" }, [
              slots.header
                ? slots.header()
                : h(
                    "h2",
                    { class: "um-dialog__title", id: titleId },
                    slots.title ? slots.title() : props.title,
                  ),
              props.showClose
                ? h("button", {
                    class: "um-dialog__close",
                    type: "submit",
                    "aria-label": "Close",
                  })
                : null,
            ]),
            h("div", { class: "um-dialog__body" }, slots.default ? slots.default() : []),
            h("div", { class: "um-dialog__footer" }, [
              ...(slots.footer
                ? slots.footer()
                : slots.actions
                  ? slots.actions()
                  : [h("button", { class: "um-dialog__action", type: "button" }, "Confirm")]),
            ]),
          ]),
        ],
      );
    };
  },
});
