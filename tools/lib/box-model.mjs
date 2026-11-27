// ui-moods · the library's own box model.
//
// The component layer states its own box model for the elements it paints:
// `box-sizing: border-box` on every component and everything inside it.
//
// A width is a promise about the space a thing takes up, and under the
// default content-box that promise is broken by the thing's own padding and
// border: an input at `width: 100%` in a 400-pixel column is 436 pixels
// wide, and the form it sits in does not fit. The documentation site hides
// this, because the site resets the box model for itself — a host that links
// the library alone got the other answer.
//
// So the library says it for itself, and says it only for itself: the rule
// names the library's own components and what is inside them. A host's own
// layout is not touched, which is the whole point — a component library that
// reset the box model of a page it was dropped into would be changing
// something it was not asked to change.
//
// The pseudo-elements are left alone on purpose. A check mark drawn with two
// borders is sized in content-box, and that is how it was drawn and how it
// was looked at; changing the box model under it would change the glyph.
//
// The rule is generated rather than written by hand, because a hand-written
// list of eighty components is a list that stops being true the moment the
// eighty-first is added — and it is generated *once*, here, so that the
// builder and the validator agree on what it is.

/**
 * The box-model rule for a set of manifests.
 *
 * @param {object[]} manifests the component manifests
 * @returns {string} the CSS the rule is
 */
export function boxModelCss(manifests) {
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
    `/* --- the library's own box model ------------------------------------------`,
    `   Every box the library paints measures itself from the outside in: the`,
    `   width you give it is the width the reader sees, with the padding and the`,
    `   border inside it rather than added to it. Without this an input at`,
    `   \`width: 100%\` is wider than the column it sits in.`,
    `   `,
    `   The rule names the library's own components and what is inside them, so a`,
    `   host's own layout is left exactly as it was.`,
    `   ------------------------------------------------------------------------ */`,
    `${selectors} { box-sizing: border-box; }`,
  ].join("\n");
}
