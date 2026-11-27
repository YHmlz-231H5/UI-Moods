// ui-moods · the group an option belongs to.
//
// A radio group is not a box around some radios — it is the thing that decides
// which one of them is picked. The browser already keeps that exclusivity for
// real radios that share a name, but the browser only knows about the *live*
// DOM: the markup a server renders, or a wrapper that draws its own state,
// has to say which option is the selected one.
//
// So the group says it, and the options ask.
//
// The mechanism is Vue's own provide/inject, which is what it is for: the
// group provides its value and a way to change it, and an option inside it
// asks for them. An option that is not inside a group is on its own and
// answers to its own props.
//
// `provide` and `inject` follow the *component* tree, not the DOM tree, so a
// radio in a group's default slot is a child of the group as far as the
// component tree is concerned — even though the markup around it was written
// somewhere else entirely.

import { inject, provide } from "vue";

/** The key the group publishes itself under. */
export const GROUP = Symbol("um.group");

/**
 * Publish a group to the options inside it.
 *
 * @param {object} group the group's context
 * @returns {object} the group, so the caller can keep using it
 */
export function provideGroup(group) {
  provide(GROUP, group);
  return group;
}

/**
 * The group this option belongs to, or `null` when it is on its own.
 *
 * @returns {object | null}
 */
export function useGroup() {
  return inject(GROUP, null);
}

/**
 * Whether an option in this group is the selected one.
 *
 * A radio group holds one value, so the option whose value it is, is the
 * selected one. A checkbox group holds a list, so the option whose value is
 * in the list, is the ticked one.
 *
 * @param {object | null} group the group, or `null`
 * @param {string} value the option's own value
 * @returns {boolean}
 */
export function isSelected(group, value) {
  if (!group) return false;
  if (Array.isArray(group.value)) return group.value.includes(value);
  return group.value === value;
}

/**
 * The value a radio group publishes when an option is picked.
 *
 * The change event bubbles out of the input, and the input that changed is
 * the one that carries the value that was picked.
 *
 * @param {Event} event the DOM event
 * @returns {string}
 */
export function pickedValue(event) {
  return event?.target?.value ?? "";
}

/**
 * The list a checkbox group publishes when an option is ticked or unticked.
 *
 * The new list is built from the list in force and the input that changed —
 * not from the list in force and the event alone — because a checkbox group
 * holds several values and one event only says what happened to one of them.
 *
 * @param {string[]} current the values that are ticked now
 * @param {Event} event the DOM event
 * @returns {string[]}
 */
export function tickedValues(current, event) {
  const target = event?.target;
  if (!target) return current;
  const rest = current.filter((v) => v !== target.value);
  return target.checked ? [...rest, target.value] : rest;
}
