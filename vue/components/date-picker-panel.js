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
//
// The week numbers are the wrapper's as well: it lays the month out in weeks,
// so it knows which week of the year each of them is in.

import { defineComponent, h, useId } from "vue";
import { modelValue } from "../lib/model.mjs";

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
    modelValue: { type: String, default: undefined },
    disabled: { type: String, default: "2026-11-05,2026-11-06" },
    showFooter: { type: Boolean, default: true },
    footerText: { type: String, default: "确定" },
    showConfirm: { type: Boolean, default: true },
    type: { type: String, default: "single" },
    border: { type: Boolean, default: true },
    singlePanel: { type: Boolean, default: false },
    clearable: { type: Boolean, default: false },
    showWeekNumber: { type: Boolean, default: false },
  },
  emits: ["click"],
  setup(props, { slots, emit }) {
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
      const weeks = weeksOf(props.month);
      const mondays = mondaysOf(props.month, weeks.length);

      return h(
        "div",
        {
          class: [
            "um-date-picker-panel",
            props.type === "range" ? "um-date-picker-panel--range" : "um-date-picker-panel--single",
            props.border ? null : "um-date-picker-panel--borderless",
            props.singlePanel ? "um-date-picker-panel--single-panel" : null,
            props.clearable ? "um-date-picker-panel--clearable" : null,
            props.showWeekNumber ? "um-date-picker-panel--week-number" : null,
          ],
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
                // The host's own mark, when it brings one; the chevron the
                // stylesheet draws, when it does not.
                slots["prev-month"] ? slots["prev-month"]() : [],
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
                slots["next-month"] ? slots["next-month"]() : [],
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
                  [
                    // The week numbers have a column of their own, so the
                    // header needs a cell for it as well.
                    props.showWeekNumber
                      ? h("span", {
                          class: "um-date-picker-panel__week-number",
                          "aria-hidden": "true",
                        })
                      : null,
                    ...names.map((name) =>
                      h(
                        "span",
                        {
                          class: "um-date-picker-panel__weekday",
                          role: "columnheader",
                        },
                        name,
                      ),
                    ),
                  ],
                ),
                ...weeks.map((week, i) =>
                  h(
                    "div",
                    { class: "um-date-picker-panel__week", role: "row" },
                    [
                      props.showWeekNumber
                        ? h(
                            "span",
                            { class: "um-date-picker-panel__week-number" },
                            String(isoWeek(mondays[i])),
                          )
                        : null,
                      ...week.map((date) => cell(date, props, blocked, slots)),
                    ],
                  ),
                ),
              ],
            ),
          ]),
          props.showFooter
            ? h("div", { class: "um-date-picker-panel__footer" }, [
                // The clear action. It sits in the footer either way and the
                // class is what shows it. The panel keeps no value, so what a
                // press on it means is the host's business, the way it is for
                // the other two actions.
                h(
                  "button",
                  {
                    class: "um-date-picker-panel__clear",
                    type: "button",
                    onClick: (e) => emit("click", e),
                  },
                  "清除",
                ),
                h(
                  "button",
                  {
                    class: "um-date-picker-panel__today",
                    type: "button",
                    onClick: (e) => emit("click", e),
                  },
                  "今天",
                ),
                // The confirm button is one of the two actions, and a panel
                // that does not want it simply leaves it out.
                props.showConfirm
                  ? h(
                      "button",
                      {
                        class: "um-date-picker-panel__confirm",
                        type: "button",
                        onClick: (e) => emit("click", e),
                      },
                      props.footerText,
                    )
                  : null,
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

/**
 * The Monday of each week of the month.
 *
 * The grid starts on the Monday of the week the first of the month falls in,
 * and every week after it is seven days on, so the week numbers have a day
 * to be worked out from.
 */
function mondaysOf(month, count) {
  const [year, mon] = month.split("-").map(Number);
  const first = new Date(year, mon - 1, 1);
  const offset = (first.getDay() + 6) % WEEK;
  const monday = new Date(year, mon - 1, 1 - offset);

  const mondays = [];
  for (let i = 0; i < count; i++) {
    mondays.push(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i * WEEK));
  }
  return mondays;
}

/**
 * The ISO week number of a date.
 *
 * The week that holds the year's first Thursday is week one, and the days
 * around the turn of the year belong to the week that holds that Thursday —
 * which is why the date is moved to the Thursday of its own week first.
 */
function isoWeek(date) {
  const day = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const weekday = day.getUTCDay() || 7;
  day.setUTCDate(day.getUTCDate() + 4 - weekday);
  const yearStart = new Date(Date.UTC(day.getUTCFullYear(), 0, 1));
  return Math.ceil(((day.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/** `11` → `11`, `3` → `03`. */
function pad(value) {
  return String(value).padStart(2, "0");
}

/** One day of the grid, with the markers it carries. */
function cell(date, props, blocked, slots) {
  if (!date) {
    return h("div", { class: "um-date-picker-panel__cell", role: "gridcell" });
  }

  const classes = ["um-date-picker-panel__cell"];
  if (date === props.today) classes.push("um-date-picker-panel__cell--today");
  else if (date === modelValue(props, props.selected)) classes.push("um-date-picker-panel__cell--selected");

  // A day that cannot be picked is marked with `aria-disabled` rather than
  // with a class: a grid cell has no `disabled` attribute, and the reader has
  // to be told the day is unavailable.
  const attrs = { class: classes, role: "gridcell" };
  if (blocked.has(date)) attrs["aria-disabled"] = "true";

  return h("div", attrs, [
    h("span", { class: "um-date-picker-panel__number" }, String(Number(date.slice(-2)))),
    // What the host puts in a day of its own. It sits beside the number, so
    // the day's own marks are still on the number.
    h(
      "span",
      { class: "um-date-picker-panel__content" },
      slots.default ? slots.default({ date }) : [],
    ),
  ]);
}
