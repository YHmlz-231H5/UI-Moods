// ui-moods · Infinite Scroll
//
// The library loads nothing: the host owns the data. What the wrapper owns is
// the container, the items and the sentinel that says which of the three
// moments the reader has reached — loading, loaded, or the end.
//
// The state is a class on the sentinel, so the host can change it without the
// library knowing anything about the data. The ring belongs to the loading
// state alone; the other two say it with a line and the words on it.

import { defineComponent, h } from "vue";

/** The variants the stylesheet paints. */
const VARIANTS = ["bordered", "plain"];

/** What the sentinel says in each of the three moments. */
const SENTINEL = {
  loading: "正在加载更多",
  loaded: "已经加载完毕",
};

/** One entry in the feed. The wrapper has no data model, so it writes a
 *  plausible one. */
function itemText(index) {
  return `Update ${String(index + 1).padStart(2, "0")} — the deployment finished and the pipeline is green.`;
}

export const UMInfiniteScroll = defineComponent({
  name: "UMInfiniteScroll",
  example: "loading",
  props: {
    variant: { type: String, default: "plain" },
    size: { type: String, default: "md" },
    items: { type: Number, default: 60 },
    state: { type: String, default: "loading" },
    height: { type: String, default: "18em" },
    endText: { type: String, default: "没有更多了" },
  },
  setup(props) {
    return () => {
      const count = Math.max(0, Math.floor(props.items));
      const state = ["loading", "loaded", "end"].includes(props.state)
        ? props.state
        : "loading";
      const line = state === "end" ? props.endText : SENTINEL[state];

      const feed = h(
        "div",
        { class: "um-infinite-scroll__feed" },
        Array.from({ length: count }, (_, index) =>
          h("div", { class: "um-infinite-scroll__item" }, itemText(index)),
        ),
      );

      const sentinel = h(
        "div",
        {
          class: [
            "um-infinite-scroll__sentinel",
            `um-infinite-scroll__sentinel--${state}`,
          ],
          role: "status",
        },
        [
          state === "loading"
            ? h("span", { class: "um-infinite-scroll__spinner", "aria-hidden": "true" })
            : null,
          h("span", { class: "um-infinite-scroll__line" }, line),
        ],
      );

      return h(
        "div",
        {
          class: [
            "um-infinite-scroll",
            VARIANTS.includes(props.variant) ? `um-infinite-scroll--${props.variant}` : null,
            sizeClass(props.size),
          ],
        },
        [
          h(
            "div",
            {
              class: "um-infinite-scroll__scroller",
              tabindex: "0",
              style: { height: props.height },
            },
            [feed, sentinel],
          ),
        ],
      );
    };
  },
});

/** The medium size is the base class on its own. */
function sizeClass(size) {
  if (size === "sm") return "um-infinite-scroll--sm";
  if (size === "lg") return "um-infinite-scroll--lg";
  return null;
}
