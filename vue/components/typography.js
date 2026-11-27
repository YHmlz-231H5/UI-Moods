// ui-moods · Typography — Vue 3 wrapper
//
// The set of text styles a page is written in. The library paints the sizes,
// the colours and the leading; the words and the heading levels are the
// host's.
//
// Every part is always rendered, because the part classes are what the
// stylesheet paints: a part that is missing from the markup is a part that
// comes out unstyled. The content of each part comes from a slot, so a host
// that only wants a title and a paragraph simply fills those two.

import { defineComponent, h, useAttrs, computed } from "vue";

export const UMTypography = defineComponent({
  name: "UMTypography",
  // The manifest example this wrapper reproduces.
  example: "the-set",

  inheritAttrs: false,

  props: {
    color: { type: String, default: "primary" },
    size: { type: String, default: "medium" },
  },

  setup(props, { slots, attrs }) {
    // The link's target is an attribute rather than a prop: the manifest does
    // not describe it, and a host that links somewhere else should not have
    // to fight the component for it.
    const href = computed(() => attrs.href ?? "#");

    return () =>
      h(
        "div",
        {
          class: [
            "um-typography",
            props.color !== "primary" ? `um-typography--${props.color}` : "",
            props.size !== "medium" ? `um-typography--${props.size}` : "",
          ],
        },
        [
          h("h2", { class: "um-typography__title" }, slots.title ? slots.title() : []),
          h("h3", { class: "um-typography__subtitle" }, slots.subtitle ? slots.subtitle() : []),
          h("p", { class: "um-typography__text" }, slots.text ? slots.text() : []),
          h("p", { class: "um-typography__secondary" }, slots.secondary ? slots.secondary() : []),
          h("span", { class: "um-typography__extra" }, slots.extra ? slots.extra() : []),
          h("p", { class: "um-typography__text" }, [
            slots.after ? slots.after() : [],
            h(
              "a",
              { class: "um-typography__link", href: href.value },
              slots.link ? slots.link() : [],
            ),
          ]),
          h(
            "blockquote",
            { class: "um-typography__quote" },
            slots.quote ? slots.quote() : [],
          ),
        ],
      );
  },
});
