// ui-moods · Upload
//
// The trigger is a label around a real file input, so the browser's own
// dialog opens and the input keeps its place in the tab order. The names of
// the chosen files are written in the markup — a library with no JavaScript
// cannot read the input's own file list — so the list slot is where the files
// go, and the wrapper only keeps the row around them.
//
// The status prop paints the one item the wrapper builds. The files a caller
// writes carry their own state class, because the real status is per file
// while the manifest gives the component a single one.

import { defineComponent, h, useId } from "vue";

/** The state classes the stylesheet declares, and the wording of the example. */
const STATUS = {
  uploading: { class: "um-upload__item--uploading", text: "Uploading" },
  done: { class: "um-upload__item--done", text: "Uploaded" },
  error: { class: "um-upload__item--error", text: "Failed" },
};

export const UMUpload = defineComponent({
  name: "UMUpload",
  example: "list",
  props: {
    multiple: { type: Boolean, default: false },
    accept: { type: String, default: "" },
    disabled: { type: Boolean, default: false },
    name: { type: String, default: "" },
    layout: { type: String, default: "list" },
    size: { type: String, default: "md" },
    status: { type: String, default: "default" },
  },
  emits: ["change"],
  setup(props, { slots, emit }) {
    // The input needs an id of its own: the trigger points at it, and two
    // uploads on one page may not share one.
    const inputId = `um-upload-input-${useId()}`;

    return () => {
      const state = STATUS[props.status] ?? null;
      const rows = slots.list ? slots.list() : [];

      return h(
        "div",
        {
          class: [
            "um-upload",
            props.layout === "text" ? "um-upload--text" : null,
            props.size === "sm"
              ? "um-upload--sm"
              : props.size === "lg"
                ? "um-upload--lg"
                : null,
          ],
        },
        [
          h("label", { class: "um-upload__trigger", for: inputId }, [
            h("input", {
              class: "um-upload__input",
              type: "file",
              id: inputId,
              name: props.name || undefined,
              accept: props.accept || undefined,
              multiple: props.multiple,
              disabled: props.disabled,
              onChange: (e) => emit("change", e),
            }),
            h(
              "span",
              { class: "um-upload__button" },
              slots.trigger ? slots.trigger() : "Choose files",
            ),
          ]),
          h(
            "ul",
            { class: "um-upload__list" },
            rows.length
              ? rows
              : [
                  h("li", { class: ["um-upload__item", state ? state.class : null] }, [
                    h("span", { class: "um-upload__name" }),
                    h("span", { class: "um-upload__size" }),
                    h("span", { class: "um-upload__status" }, state ? state.text : ""),
                  ]),
                ],
          ),
        ],
      );
    };
  },
});
