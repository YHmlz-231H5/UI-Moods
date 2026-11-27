// ui-moods · Config Provider
//
// Element Plus's config provider is a Vue context: it hands the global size,
// the z-index, the locale and the namespace down to everything beneath it.
// A CSS-only library has no context to hand anything down, so this wrapper is
// an attribute contract instead — it writes the attributes, and the library's
// own CSS answers to them.
//
// What it sets is the density and the radius mode of its subtree. What it
// cannot set is a locale, a namespace or a z-index, and it does not pretend
// otherwise.

import { defineComponent, h } from "vue";

export const UMConfigProvider = defineComponent({
  name: "UMConfigProvider",
  example: "density",
  props: {
    size: { type: String, default: "md" },
    radius: { type: String, default: "soft" },
  },
  setup(props, { slots }) {
    return () =>
      h(
        "div",
        {
          class: "um-config-provider",
          "data-um-size": props.size,
          "data-um-radius": props.radius,
        },
        slots.default ? slots.default() : [],
      );
  },
});
