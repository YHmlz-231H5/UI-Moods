// ui-moods · Pagination
//
// The page count is worked out from the total and the page size, so the
// wrapper can paint the current page itself. The total line and the jumper
// are declared parts, so they are always rendered, and their wording follows
// the documented example — the library has nowhere to put a translation.

import { defineComponent, h, useId } from "vue";

export const UMPagination = defineComponent({
  name: "UMPagination",
  example: "basic",
  props: {
    total: { type: Number, default: 0 },
    currentPage: { type: Number, default: 1 },
    pageSize: { type: String, default: "10" },
    size: { type: String, default: "md" },
  },
  setup(props) {
    // The jumper's field needs a label of its own, so it needs an id that
    // no other pager on the page shares.
    const jumpId = `um-pagination-jump-${useId()}`;

    return () => {
      const perPage = Number(props.pageSize) || 10;
      const pages = Math.max(1, Math.ceil(props.total / perPage));
      const current = Math.min(Math.max(props.currentPage, 1), pages);

      const numbers = [];
      for (let i = 1; i <= pages; i++) {
        const active = i === current;
        numbers.push(
          h("li", { class: ["um-pagination__item", active ? "um-pagination__active" : null], key: i }, [
            h(
              "a",
              {
                class: "um-pagination__link",
                href: "#",
                ...(active ? { "aria-current": "page" } : {}),
              },
              String(i),
            ),
          ]),
        );
      }

      return h(
        "nav",
        {
          class: ["um-pagination", props.size === "sm" ? "um-pagination--sm" : null],
          "aria-label": "Pagination",
        },
        [
          h("ul", { class: "um-pagination__list" }, [
            h("li", { class: "um-pagination__item um-pagination__prev" }, [
              h("button", {
                class: "um-pagination__link",
                type: "button",
                disabled: current <= 1,
                "aria-label": "Previous page",
              }),
            ]),
            ...numbers,
            h("li", { class: "um-pagination__item um-pagination__next" }, [
              h("button", {
                class: "um-pagination__link",
                type: "button",
                disabled: current >= pages,
                "aria-label": "Next page",
              }),
            ]),
          ]),
          h("span", { class: "um-pagination__total" }, `${props.total} records`),
          h("span", { class: "um-pagination__jumper" }, [
            h("label", { for: jumpId }, "Go to"),
            h("input", {
              class: "um-pagination__input",
              id: jumpId,
              type: "number",
              min: 1,
              max: pages,
              value: current,
            }),
            h("span", `of ${pages} pages`),
          ]),
        ],
      );
    };
  },
});
