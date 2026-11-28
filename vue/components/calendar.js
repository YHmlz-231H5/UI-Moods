// ui-moods · Calendar
//
// A month is a grid of days, and a grid cannot know which months exist, so
// the wrapper draws the month it is given and leaves the month switching to
// the host: there is no prev/next button here, because the buttons would have
// to know the neighbouring months and the library does not keep a calendar.
//
// The three markers are the wrapper's own. It knows which date is today, which
// one is selected and which ones cannot be picked, so it writes the state on
// the cell instead of leaving that to the caller: two of them as a class, and
// the third as aria-disabled, because a grid cell has no disabled attribute
// and the reader has to be told. The weekday names are written out rather than
// derived, so a month may start on Monday or on Sunday and a host may name
// the columns in its own language.

import { defineComponent, h } from "vue";
import { modelValue } from "../lib/model.mjs";

/** Seven days to a week, and the first of them is Monday. */
const WEEK = 7;

export const UMCalendar = defineComponent({
  name: "UMCalendar",
  example: "month",
  props: {
    variant: { type: String, default: "bordered" },
    size: { type: String, default: "md" },
    month: { type: String, default: "2026-11" },
    weekdays: { type: String, default: "Mon,Tue,Wed,Thu,Fri,Sat,Sun" },
    today: { type: String, default: "2026-11-28" },
    selected: { type: String, default: "2026-11-20" },
    modelValue: { type: String, default: undefined },
    disabled: { type: String, default: "2026-11-05,2026-11-06" },
  },
  setup(props, { slots }) {
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
          class: [
            "um-calendar",
            props.variant === "plain"
              ? "um-calendar--plain"
              : props.variant === "bordered"
                ? "um-calendar--bordered"
                : null,
            props.size === "sm"
              ? "um-calendar--sm"
              : props.size === "lg"
                ? "um-calendar--lg"
                : null,
          ],
          role: "grid",
        },
        [
          // The heading of the panel. The month and the way it is named are
          // the host's, so the heading is the host's too.
          h("div", { class: "um-calendar__caption" }, slots.header ? slots.header() : []),
          h(
            "div",
            { class: "um-calendar__header", role: "row" },
            names.map((name) =>
              h("span", { class: "um-calendar__weekday", role: "columnheader" }, name),
            ),
          ),
          h(
            "div",
            { class: "um-calendar__grid", role: "rowgroup" },
            weeksOf(props.month).map((week) =>
              h(
                "div",
                { class: "um-calendar__week", role: "row" },
                week.map((date) => cell(date, props, blocked, slots["date-cell"])),
              ),
            ),
          ),
        ],
      );
    };
  },
});

/**
 * The weeks of a month, as seven dates per week.
 *
 * The dates are strings, so a date the caller wrote ("2026-11-28") can be
 * compared with a date the calendar worked out. The first week may start
 * short: the days before the first of the month are null, because they belong
 * to the month before and this grid does not draw it.
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
function cell(date, props, blocked, dateCell) {
  if (!date) return h("div", { class: "um-calendar__cell", role: "gridcell" });

  const classes = ["um-calendar__cell"];
  if (date === props.today) classes.push("um-calendar__cell--today");
  else if (date === modelValue(props, props.selected)) classes.push("um-calendar__cell--selected");

  // A day that cannot be picked is marked with `aria-disabled` rather than
  // with a class: a grid cell has no `disabled` attribute, and the reader has
  // to be told the day is unavailable.
  const attrs = { class: classes, role: "gridcell" };
  if (blocked.has(date)) attrs["aria-disabled"] = "true";

  return h("div", attrs, [
    h(
      "span",
      { class: "um-calendar__number" },
      // The day number, unless the caller wrote something else in the cell.
      dateCell ? dateCell({ date }) : String(Number(date.slice(-2))),
    ),
  ]);
}
