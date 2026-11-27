// ui-moods · the value a component shows.
//
// The library is plain HTML and CSS, so it has no notion of a bound value —
// a control's state is a prop, and the host owns it. Vue has a notion of a
// bound value, and it is called `v-model`.
//
// So every value-bearing component answers to `modelValue` as well as to its
// own prop. The own prop stays the fallback: a host that writes
// `<UMSwitch :checked="on" />` gets exactly what it got before, and a host
// that writes `<UMSwitch v-model="on" />` gets the Vue way.
//
// The distinction that matters is *undefined*. A prop that was not passed is
// `undefined`, which is not the same as `false`, `0` or `""`. So a caller who
// binds a false value has that false value stick, rather than being overruled
// by the fallback.

/**
 * The value a component should show.
 *
 * @param {object} props the component's props
 * @param {*} fallback the component's own prop, used when `modelValue` was
 *   not passed at all
 * @returns {*} the value in force
 */
export function modelValue(props, fallback) {
  return props.modelValue !== undefined ? props.modelValue : fallback;
}

/**
 * The value a control just produced.
 *
 * A checkbox and a radio are the two controls whose DOM event carries the new
 * state directly; a text control carries it in `target.value`. Reading it in
 * one place keeps the wrappers from each inventing their own idea of what
 * "the new value" is.
 *
 * @param {Event} event the DOM event
 * @param {boolean} [boolean] true when the control is a checkbox or a radio
 * @returns {*} the new value
 */
export function eventValue(event, boolean = false) {
  const target = event?.target;
  if (boolean) return Boolean(target?.checked);
  return target?.value ?? "";
}
