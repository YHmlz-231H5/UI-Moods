// ui-moods · Tabs
//
// The radios are the control, and each radio sits inside the label of its own
// tab, so the browser sees one group of radios and holds it as a single stop
// in the tab order. The stylesheet pairs the Nth radio with the Nth panel by
// position, so the bar of tabs comes first and the panels last. The tab
// labels are the default slot, one child per tab, and the panel slot is
// called once per tab with its index.
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
    disabled: { type: Boolean, default: false },
  },
  emits: ["change", "update:modelValue"],
  setup(props, { slots, emit, attrs }) {
    return () => {
      const labels = slots.default ? slots.default() : [];
      const count = Math.max(labels.length, 1);
      const group = props.name || "um-tabs";
      const open = modelValue(props, props.selected);
      // The name of the group of radios is an attribute rather than a prop:
      // it is not a visual parameter of the widget, and a host that needs a
      // Chinese name should be able to give one.
      const label = attrs["aria-label"];

      const items = [];
      const panels = [];
      for (let i = 1; i <= count; i++) {
        items.push(
          h(
            "label",
            {
              class: "um-tabs__item",
              id: `${group}-tab-${i}`,
              for: `${group}-${i}`,
            },
            [
              h("input", {
                class: "um-tabs__radio",
                type: "radio",
                name: group,
                id: `${group}-${i}`,
                "aria-controls": `${group}-panel-${i}`,
                checked: i === open,
                // The real disabled attribute: the browser refuses to select a
                // disabled radio and takes it out of the tab order.
                disabled: props.disabled || undefined,
                onChange: (e) => {
                  emit("update:modelValue", i);
                  emit("change", e);
                },
              }),
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
              role: "group",
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
            props.disabled ? "um-tabs--disabled" : null,
          ],
        },
        [
          h(
            "div",
            {
              class: "um-tabs__header",
              role: "radiogroup",
              "aria-label": label || undefined,
            },
            items,
          ),
          ...panels,
        ],
      );
    };
  },
});
