// ui-moods · Date Picker Panel
//
// A month panel cannot know which months exist, so the wrapper draws the
// month it is given and leaves the month switching to the host: the two
// buttons in the header are real buttons, but what a press on them means is
// the host's business, exactly as the calendar's month belongs to the host.
//
// The three markers are the wrapper's own. It knows which date is today,
// which one is selected and which ones cannot be picked, so it writes the
// state on the cell instead of leaving that to the caller: two of them as a
// class, and the third as aria-disabled, because a grid cell has no disabled
// attribute and the reader has to be told.

import { defineComponent, h, useId } from "vue";

/** Seven days to a week, and the first of them is Monday. */
const WEEK = 7;

export const UMDatePickerPanel = defineComponent({
  name: "UMDatePickerPanel",
  example: "single",
  props: {
    month: { type: String, default: "2026-11" },
    weekdays: { type: String, default: "Mon,Tue,Wed,Thu,Fri,Sat,Sun" },
    today: { type: String, default: "2026-11-28" },
    selected: { type: String, default: "2026-11-20" },
    disabled: { type: String, default: "2026-11-05,2026-11-06" },
    showFooter: { type: Boolean, default: true },
    footerText: { type: String, default: "确定" },
  },
  emits: ["click"],
  setup(props, { emit }) {
    // The grid is named by its own title, so the two travel together.
    const titleId = `um-date-picker-panel-title-${useId()}`;

    return () => {
      const names = props.weekdays
        .split(",")
        .map((name) => name.trim())
        .filter(Boolean);
      const blocked = new Set(
        props.disabled
          .split(",")
          .map((date) => date.trim())
          .filter(Boolean),
      );

      return h(
        "div",
        {
          class: ["um-date-picker-panel", "um-date-picker-panel--single"],
        },
        [
          h("div", { class: "um-date-picker-panel__panel" }, [
            h("div", { class: "um-date-picker-panel__header" }, [
              h(
                "button",
                {
                  class: "um-date-picker-panel__prev",
                  type: "button",
                  "aria-label": "Previous month",
                  onClick: (e) => emit("click", e),
                },
                [],
              ),
              h(
                "span",
                { class: "um-date-picker-panel__title", id: titleId },
                props.month,
              ),
              h(
                "button",
                {
                  class: "um-date-picker-panel__next",
                  type: "button",
                  "aria-label": "Next month",
                  onClick: (e) => emit("click", e),
                },
                [],
              ),
            ]),
            h(
              "div",
              {
                class: "um-date-picker-panel__grid",
                role: "grid",
                "aria-labelledby": titleId,
              },
              [
                h(
                  "div",
                  { class: "um-date-picker-panel__week", role: "row" },
                  names.map((name) =>
                    h(
                      "span",
                      {
                        class: "um-date-picker-panel__weekday",
                        role: "columnheader",
                      },
                      name,
                    ),
                  ),
                ),
                ...weeksOf(props.month).map((week) =>
                  h(
                    "div",
                    { class: "um-date-picker-panel__week", role: "row" },
                    week.map((date) => cell(date, props, blocked)),
                  ),
                ),
              ],
            ),
          ]),
          props.showFooter
            ? h("div", { class: "um-date-picker-panel__footer" }, [
                h(
                  "button",
                  {
                    class: "um-date-picker-panel__today",
                    type: "button",
                    onClick: (e) => emit("click", e),
                  },
                  "今天",
                ),
                h(
                  "button",
                  {
                    class: "um-date-picker-panel__confirm",
                    type: "button",
                    onClick: (e) => emit("click", e),
                  },
                  props.footerText,
                ),
              ])
            : null,
        ],
      );
    };
  },
});

/**
 * The weeks of a month, as seven dates per week.
 *
 * The dates are strings, so a date the caller wrote ("2026-11-28") can be
 * compared with a date the panel worked out. The first week may start
 * short: the days before the first of the month are null, because they
 * belong to the month before and this grid does not draw it.
 */
function weeksOf(month) {
  const [year, mon] = month.split("-").map(Number);
  const first = new Date(year, mon - 1, 1);
  const days = new Date(year, mon, 0).getDate();

  const cells = [];
  // The week starts on Monday, so the offset is the first day counted from
  // Monday rather than from Sunday.
  const offset = (first.getDay() + 6) % WEEK;
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let day = 1; day <= days; day++) {
    cells.push(`${year}-${pad(mon)}-${pad(day)}`);
  }
  while (cells.length % WEEK) cells.push(null);

  const weeks = [];
  for (let i = 0; i < cells.length; i += WEEK) weeks.push(cells.slice(i, i + WEEK));
  return weeks;
}

/** `11` → `11`, `3` → `03`. */
function pad(value) {
  return String(value).padStart(2, "0");
}

/** One day of the grid, with the markers it carries. */
function cell(date, props, blocked) {
  if (!date) {
    return h("div", { class: "um-date-picker-panel__cell", role: "gridcell" });
  }

  const classes = ["um-date-picker-panel__cell"];
  if (date === props.today) classes.push("um-date-picker-panel__cell--today");
  else if (date === props.selected) classes.push("um-date-picker-panel__cell--selected");

  // A day that cannot be picked is marked with `aria-disabled` rather than
  // with a class: a grid cell has no `disabled` attribute, and the reader has
  // to be told the day is unavailable.
  const attrs = { class: classes, role: "gridcell" };
  if (blocked.has(date)) attrs["aria-disabled"] = "true";

  return h("div", attrs, [
    h("span", { class: "um-date-picker-panel__number" }, String(Number(date.slice(-2)))),
  ]);
}
