// ui-moods · Empty
//
// The empty state is a message rather than a picture: the title is the
// message and the art is decoration, so the art is hidden from the screen
// reader and the loose text under the title is the default slot.

import { defineComponent, h } from "vue";

export const UMEmpty = defineComponent({
  name: "UMEmpty",
  example: "empty",
  setup(props, { slots }) {
    return () =>
      h("div", { class: "um-empty" }, [
        h("span", { class: "um-empty__art", "aria-hidden": "true" }, slots.art ? slots.art() : []),
        h("span", { class: "um-empty__title" }, slots.title ? slots.title() : []),
        h("span", slots.default ? slots.default() : []),
      ]);
  },
});
