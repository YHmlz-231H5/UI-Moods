// ui-moods · Avatar
//
// The library cannot fall back on its own — no script may run — so the host
// decides which of the three forms is written: the photo, the initials or the
// icon. The wrapper therefore keeps all three parts and lets the caller fill
// them; a part with nothing in it is taken out of the flow, because the
// stylesheet paints the icon as a box of its own.

import { defineComponent, cloneVNode, h } from "vue";

export const UMAvatar = defineComponent({
  name: "UMAvatar",
  example: "image",
  props: {
    variant: { type: String, default: "circle" },
    size: { type: String, default: "md" },
    alt: { type: String, default: "" },
  },
  setup(props, { slots }) {
    return () => {
      const photo = slots.image ? slots.image() : [];
      const icon = slots.icon ? slots.icon() : [];

      return h(
        "span",
        {
          class: [
            "um-avatar",
            `um-avatar--${props.variant}`,
            // The medium avatar is the base class; the modifier would only
            // repeat it.
            props.size !== "md" ? `um-avatar--${props.size}` : null,
          ],
        },
        [
          // The photo is the caller's own img element; the class is added
          // here so the caller does not have to repeat it.
          photo.length
            ? cloneVNode(photo[0], {
                class: "um-avatar__image",
                ...(props.alt && !photo[0].props?.alt ? { alt: props.alt } : {}),
              })
            : h("img", { class: "um-avatar__image", alt: props.alt, hidden: true }),
          h(
            "span",
            {
              class: "um-avatar__icon",
              "aria-hidden": "true",
              // The stylesheet draws the icon as a flex box of its own, so
              // the hidden attribute would not take it out of the flow.
              style: icon.length ? null : { display: "none" },
            },
            icon,
          ),
          slots.default ? slots.default() : [],
        ],
      );
    };
  },
});
