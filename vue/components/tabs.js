// ui-moods · Tabs
//
// The radios are the control, and the stylesheet pairs the Nth radio with the
// Nth tab and the Nth panel by position, so the wrapper renders the radios
// first, the header second and the panels last. The tab labels are the
// default slot, one child per tab, and the panel slot is called once per
// tab with its index.
//
// The open tab answers to `v-model` as well: the binding wins over the
// `selected` prop, and a change publishes the tab that was picked.

import { defineComponent, h } from "vue";
import { modelValue } from "../lib/model.mjs";

export const UMTabs = defineComponent({
  name: "UMTabs",
  example: "basic",
  props: {
    name: { type: String, default: "" },
    type: { type: String, default: "line" },
    selected: { type: Number, default: 1 },
    modelValue: { type: Number, default: undefined },
    stretch: { type: Boolean, default: false },
    tabPosition: { type: String, default: "top" },
  },
  emits: ["change", "update:modelValue"],
  setup(props, { slots, emit }) {
    return () => {
      const labels = slots.default ? slots.default() : [];
      const count = Math.max(labels.length, 1);
      const group = props.name || "um-tabs";
      const open = modelValue(props, props.selected);

      const radios = [];
      const items = [];
      const panels = [];
      for (let i = 1; i <= count; i++) {
        radios.push(
          h("input", {
            class: "um-tabs__radio",
            type: "radio",
            name: group,
            id: `${group}-${i}`,
            "aria-controls": `${group}-panel-${i}`,
            checked: i === open,
            onChange: (e) => {
              emit("update:modelValue", i);
              emit("change", e);
            },
          }),
        );
        items.push(
          h(
            "label",
            {
              class: "um-tabs__item",
              id: `${group}-tab-${i}`,
              role: "tab",
              for: `${group}-${i}`,
            },
            [
              h(
                "span",
                { class: "um-tabs__label" },
                slots.label ? slots.label({ index: i - 1 }) : labels[i - 1] ?? [],
              ),
              h("span", { class: "um-tabs__indicator", "aria-hidden": "true" }),
            ],
          ),
        );
        panels.push(
          h(
            "section",
            {
              class: "um-tabs__panel",
              id: `${group}-panel-${i}`,
              role: "tabpanel",
              "aria-labelledby": `${group}-tab-${i}`,
              tabindex: 0,
            },
            slots.panel ? slots.panel({ index: i - 1, name: group }) : [],
          ),
        );
      }

      return h(
        "div",
        {
          class: [
            "um-tabs",
            props.type === "card" ? "um-tabs--card" : null,
            props.stretch ? "um-tabs--stretch" : null,
            props.tabPosition === "bottom" ? "um-tabs--bottom" : null,
          ],
        },
        [
          ...radios,
          h("div", { class: "um-tabs__header", role: "tablist" }, items),
          ...panels,
        ],
      );
    };
  },
});
