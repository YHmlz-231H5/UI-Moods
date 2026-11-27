// ui-moods · Carousel
//
// The track is a real scroller and the browser snaps it from one slide to the
// next, so a swipe, a scrollbar and the arrow keys all work without script.
// The buttons are links, because that is the only thing a stylesheet can ask
// a scroller to do: a fragment that names a slide inside the track scrolls
// the track to it.
//
// The buttons live in the slide they belong to, so "the slide before this
// one" is something the markup can say. The wrapper gives each slide its id
// and writes the two links, and the caller supplies the slides themselves.

import { defineComponent, h } from "vue";

export const UMCarousel = defineComponent({
  name: "UMCarousel",
  example: "plain",
  props: {
    name: { type: String, default: "" },
    variant: { type: String, default: "plain" },
    size: { type: String, default: "md" },
    label: { type: String, default: "" },
  },
  setup(props, { slots }) {
    return () => {
      const slides = slots.default ? slots.default() : [];
      const group = props.name || "um-carousel";
      const count = Math.max(slides.length, 1);
      const painted = slides.length
        ? slides.map((vnode, index) => paintSlide(vnode, group, index, count))
        : [paintSlide(h("figure", {}, [h("div"), h("figcaption")]), group, 0, 1)];

      return h(
        "div",
        {
          class: [
            "um-carousel",
            props.variant === "spaced"
              ? "um-carousel--spaced"
              : props.variant === "plain"
                ? "um-carousel--plain"
                : null,
            props.size === "sm"
              ? "um-carousel--sm"
              : props.size === "lg"
                ? "um-carousel--lg"
                : null,
          ],
        },
        [
          h(
            "div",
            {
              class: "um-carousel__track",
              tabindex: 0,
              role: "group",
              "aria-label": props.label || undefined,
            },
            painted,
          ),
        ],
      );
    };
  },
});

/**
 * One slide: its id, its body, its caption and its buttons.
 *
 * The id is what the buttons point at, and the buttons point at this slide's
 * neighbours, which is why they belong to the slide rather than to a row
 * outside it.
 */
function paintSlide(vnode, group, index, count) {
  const children = (Array.isArray(vnode.children) ? vnode.children : [vnode.children])
    .filter(Boolean)
    .map((child) => {
      if (typeof child !== "object" || !child.type) return child;
      if (child.type === "div") {
        return h("div", { ...child.props, class: "um-carousel__body" });
      }
      if (child.type === "figcaption") {
        return h("figcaption", { ...child.props, class: "um-carousel__caption" });
      }
      return child;
    });

  return h(
    "figure",
    { ...vnode.props, class: "um-carousel__slide", id: `${group}-slide-${index + 1}` },
    [...children, buttons(group, index, count)],
  );
}

/**
 * The two buttons of a slide.
 *
 * They wrap around: the first slide's previous button points at the last
 * one, and the last slide's next button points at the first.
 */
function buttons(group, index, count) {
  const previous = index === 0 ? count : index;
  const next = index === count - 1 ? 1 : index + 2;
  return h("nav", { class: "um-carousel__nav" }, [
    h("a", {
      class: "um-carousel__prev",
      href: `#${group}-slide-${previous}`,
      "aria-label": "Previous slide",
    }),
    h("a", {
      class: "um-carousel__next",
      href: `#${group}-slide-${next}`,
      "aria-label": "Next slide",
    }),
  ]);
}
