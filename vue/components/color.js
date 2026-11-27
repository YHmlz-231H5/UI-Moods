// ui-moods · Color
//
// The palette is the set of semantic roles the contract names, so the wrapper
// owns the cells: which role each one is, and the address of the value under
// it. A resolved hex cannot be read back out of CSS, so the cell prints the
// role and the page may write the value it resolved into the markup.

import { defineComponent, h } from "vue";

const ROLES = [
  { id: "primary", name: "primary", value: "--um-color-primary" },
  { id: "success", name: "success", value: "--um-color-success" },
  { id: "warning", name: "warning", value: "--um-color-warning" },
  { id: "danger", name: "danger", value: "--um-color-danger" },
  { id: "info", name: "info", value: "--um-color-info" },
];

export const UMColor = defineComponent({
  name: "UMColor",
  example: "palette",
  props: {
    size: { type: String, default: "md" },
  },
  setup(props) {
    return () =>
      h(
        "ul",
        {
          class: ["um-color", props.size !== "md" ? `um-color--${props.size}` : null],
        },
        ROLES.map((role) =>
          h("li", { class: ["um-color__cell", `um-color--${role.id}`] }, [
            h("span", { class: "um-color__swatch" }, role.name),
            h("span", { class: "um-color__value" }, role.value),
          ]),
        ),
      );
  },
});
