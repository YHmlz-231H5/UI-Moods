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
    arrow: { type: String, default: "always" },
    loop: { type: Boolean, default: true },
    type: { type: String, default: "default" },
  },
  setup(props, { slots }) {
    return () => {
      const slides = slots.default ? slots.default() : [];
      const group = props.name || "um-carousel";
      const count = Math.max(slides.length, 1);
      // The card run is the spaced one: the neighbouring slides show at the
      // edges of the track.
      const spaced = props.variant === "spaced" || props.type === "card";
      const painted = slides.length
        ? slides.map((vnode, index) => paintSlide(vnode, group, index, count, props.loop))
        : [paintSlide(h("figure", {}, [h("div"), h("figcaption")]), group, 0, 1, props.loop)];

      return h(
        "div",
        {
          class: [
            "um-carousel",
            spaced ? "um-carousel--spaced" : "um-carousel--plain",
            props.size === "sm"
              ? "um-carousel--sm"
              : props.size === "lg"
                ? "um-carousel--lg"
                : null,
            // The always run is the base class; the modifier would only
            // repeat it.
            props.arrow === "never"
              ? "um-carousel--arrow-never"
              : props.arrow === "hover"
                ? "um-carousel--arrow-hover"
                : null,
            props.loop ? null : "um-carousel--no-loop",
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
function paintSlide(vnode, group, index, count, loop) {
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
    [...children, buttons(group, index, count, loop)],
  );
}

/**
 * The two buttons of a slide.
 *
 * They wrap around: the first slide's previous button points at the last
 * one, and the last slide's next button points at the first. Without the
 * loop there is nothing to wrap to, so the button at the end points at the
 * slide it is on — and the stylesheet takes it away.
 */
function buttons(group, index, count, loop) {
  const previous = index === 0 ? (loop ? count : index + 1) : index;
  const next = index === count - 1 ? (loop ? 1 : index + 1) : index + 2;
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
