// ui-moods · the library's own motion contract.
//
// The library moves in two ways. Some of it moves on its own — a loading ring
// turns, a skeleton shimmers — and some of it moves when the reader does
// something: a button changes colour, a drawer slides in.
//
// The first kind is already opt-in. Every animation the library starts by
// itself is written inside `prefers-reduced-motion: no-preference`, so a
// reader who has asked for less motion never sees it at all.
//
// The second kind is the one this file is about. A transition is a motion, and
// WCAG asks for interaction-triggered motion to be switchable off. The
// library has thirty-four transition rules — hover fills, focus rings, the
// slide of a drawer — and none of them were reachable from a reader's
// preference.
//
// So the library answers it once, here: when the reader has asked for reduced
// motion, the library's own elements stop transitioning and stop animating.
//
// The durations are not set to zero. They are set to a hundredth of a
// millisecond, which is the convention: a transition of zero length does not
// fire `transitionend` at all, and a host that waits for that event to know a
// panel has finished moving would wait for ever. A hundredth of a millisecond
// is short enough that nothing visibly moves and long enough that the event
// still comes.
//
// The rule is scoped to the library's own elements, for the same reason the
// box model is: a component library that turned off the motion of a page it
// was dropped into would be changing something it was not asked to change.
//
// And it is generated rather than written by hand, because a hand-written list
// of eighty components is a list that stops being true the moment the
// eighty-first is added — and it is generated *once*, here, so that the
// builder and the validator agree on what it is.

/**
 * The reduced-motion rule for a set of manifests.
 *
 * @param {object[]} manifests the component manifests
 * @returns {string} the CSS the rule is
 */
export function motionCss(manifests) {
  // The entries are joined with a comma, not with a newline. A newline in a
  // selector list is whitespace, and whitespace between two compound
  // selectors is a descendant combinator — so a list broken over lines
  // without commas is one enormous selector that matches nothing, and the
  // rule silently does nothing at all.
  const selectors = [...new Set(manifests.flatMap((m) => [m.class.base, ...(m.class.also ?? [])]))]
    .sort()
    .map((cls) => `.${cls}, .${cls} *`)
    .join(",\n");

  return [
    `/* --- the library's own motion contract ------------------------------------`,
    `   The library moves when the reader does something: a fill changes, a`,
    `   drawer slides. That is motion, and a reader who has asked the system`,
    `   for less motion should not get it.`,
    `  `,
    `   The durations are a hundredth of a millisecond rather than zero, because`,
    `   a transition of zero length never fires \`transitionend\` — and a host that`,
    `   waits for that event to know a panel has finished would wait for ever.`,
    `  `,
    `   The rule names the library's own components and what is inside them, so a`,
    `   host's own motion is left exactly as it was.`,
    `   ------------------------------------------------------------------------ */`,
    `@media (prefers-reduced-motion: reduce) {`,
    `  ${selectors} {`,
    `    transition-duration: 0.01ms !important;`,
    `    transition-delay: 0s !important;`,
    `    animation-duration: 0.01ms !important;`,
    `    animation-delay: 0s !important;`,
    `    animation-iteration-count: 1 !important;`,
    `  }`,
    `}`,
  ].join("\n");
}
