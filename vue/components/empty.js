// ui-moods · Empty
//
// The empty state is a message rather than a picture: the title is the
// message and the art is decoration, so the art is hidden from the screen
// reader and the loose text under the title is the default slot.
//
// Element Plus calls the illustration the image slot and the line under it
// the description slot; the library calls them art and title. Both names fill
// the same parts, and the longer name wins when a host uses both.

import { defineComponent, h } from "vue";

export const UMEmpty = defineComponent({
  name: "UMEmpty",
  example: "empty",
  setup(props, { slots }) {
    return () => {
      const art = slots.image ? slots.image() : slots.art ? slots.art() : [];
      const title = slots.description
        ? slots.description()
        : slots.title
          ? slots.title()
          : [];

      return h("div", { class: "um-empty" }, [
        h("span", { class: "um-empty__art", "aria-hidden": "true" }, art),
        h("span", { class: "um-empty__title" }, title),
        h("span", slots.default ? slots.default() : []),
      ]);
    };
  },
});
