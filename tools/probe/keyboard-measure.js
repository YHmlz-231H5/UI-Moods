// ui-moods · the keyboard measurement, as a module.
//
// The probe is a measuring instrument, not a page anybody looks at. It asks
// one question of every control the library ships: can a reader who never
// touches a mouse find it, name it, and see where they are?
//
// Three of the other instruments in this repository look at the picture, and
// the picture can be perfect while the keyboard is useless:
//
//   - the contrast probe says the colours are right;
//   - the geometry probe says the boxes are where they were asked to be;
//   - the state probe says the selected thing looks different from the
//     unselected one.
//
// None of them notices that the focus ring is never painted, that the
// button's accessible name is an empty string, or that a control announces
// itself as a button and sits outside the tab order so the keyboard can
// never reach it. A reader with a keyboard would call all three libraries
// unusable, and every other instrument would say they were fine.
//
// So this one asks three separate questions of every focusable thing:
//
//   1. Is it named?      — can a screen reader say what it is?
//   2. Is it reachable?  — can the Tab key get there at all?
//   3. Is it visible?    — when it has the focus, can the reader see it?
//
// And then it asks the follow-up question that matters most: the focus
// indicator is a coloured shape, so it has to be readable against whatever it
// sits on. WCAG 2.2 asks 3:1 of a non-text indicator, and a focus ring is a
// non-text indicator.
//
// The measurement is not re-implemented here. The colour maths is the same
// code the contrast probe uses, imported rather than copied — a second
// implementation of the contrast ratio is a second opinion nobody asked for,
// and the two would drift apart the first time one of them was corrected.
//
// One thing has to be true before any of this can be measured, and it is not
// a property of the library: the browser has to be in *keyboard* mode. The
// browser only paints a `:focus-visible` ring when the reader's last
// interaction was a keypress, and a probe that focuses things with a script
// is asking the browser a question it will answer "no" to. So the driver
// presses a real Tab key before the page measures anything, and the page
// waits for that to have happened.
//
// And when the browser will not play along — the page was opened by hand and
// nobody pressed a key — the probe does not blame the library. It falls back
// to the stylesheet: a control that no `:focus-visible` rule can reach has no
// ring of its own, whatever the browser feels like doing. That reading does
// not need keyboard mode, so it is always available.

import {
  loadStyles,
  parse,
  ratio,
  over,
  effectiveBackground,
  hex,
} from "./contrast-measure.js";

/**
 * The roles that promise the reader an action or a value.
 *
 * These are the roles that must be reachable: a `role="button"` that is not
 * in the tab order is a promise the keyboard cannot keep, and the reader is
 * left with a thing that looks like a button and answers to nothing.
 */
const LEAF_ROLES = new Set([
  "button",
  "link",
  "checkbox",
  "radio",
  "switch",
  "tab",
  "menuitem",
  "menuitemcheckbox",
  "menuitemradio",
  "option",
  "combobox",
  "textbox",
  "searchbox",
  "slider",
  "spinbutton",
  "treeitem",
]);

/**
 * The roles that hold other roles.
 *
 * A listbox, a tablist or a toolbar is not itself a stop in the tab order —
 * the browser moves the focus *inside* it, from one option to the next. So a
 * container that is not focusable is not a defect, and a probe that says so
 * would send the author to fix something that was never broken.
 */
const CONTAINER_ROLES = new Set([
  "listbox",
  "list",
  "menu",
  "menubar",
  "radiogroup",
  "tablist",
  "tree",
  "treegrid",
  "grid",
  "row",
  "rowgroup",
  "columnheader",
  "rowheader",
  "gridcell",
  "cell",
  "toolbar",
  "table",
  "form",
  "region",
  "group",
  "dialog",
  "alertdialog",
]);

/**
 * The roles whose name is what they contain.
 *
 * A button that says "Save" is named "Save". A textbox is not — its name
 * comes from the label that points at it, and a placeholder is a hint rather
 * than a name, so a placeholder never counts here.
 */
const NAME_FROM_CONTENT = new Set([
  "button",
  "link",
  "tab",
  "menuitem",
  "menuitemcheckbox",
  "menuitemradio",
  "option",
  "checkbox",
  "radio",
  "switch",
  "treeitem",
  "rowheader",
  "columnheader",
  "gridcell",
  "tooltip",
  "heading",
  "status",
  "alert",
  "caption",
  "legend",
]);

/** The elements whose own text is their name, without an ARIA role. */
const NAME_FROM_TEXT_TAGS = new Set([
  "button",
  "a",
  "summary",
  "option",
  "label",
  "legend",
  "caption",
  "th",
  "td",
]);

/**
 * The properties that make up what the reader sees of a box.
 *
 * The list is the paint, not the layout: a box that only moves when it takes
 * the focus has told the reader where they are, so the geometry is not part
 * of the comparison.
 */
const PAINT_PROPS = [
  "outline-style",
  "outline-width",
  "outline-color",
  "outline-offset",
  "box-shadow",
  "border-top-color",
  "border-right-color",
  "border-bottom-color",
  "border-left-color",
  "border-top-width",
  "border-right-width",
  "border-bottom-width",
  "border-left-width",
  "background-color",
  "background-image",
  "color",
  "text-decoration-line",
  "opacity",
  "visibility",
];

/** The paint of a box, as a map of property to value. */
function paint(el) {
  const cs = getComputedStyle(el);
  const out = {};
  for (const p of PAINT_PROPS) out[p] = cs.getPropertyValue(p);
  return out;
}

/** Did the paint change between two readings? */
function paintChanged(before, after) {
  for (const p of PAINT_PROPS) if (before[p] !== after[p]) return true;
  return false;
}

/** The properties that changed between two readings, as a readable list. */
function paintDiff(before, after) {
  const out = [];
  for (const p of PAINT_PROPS) {
    if (before[p] === after[p]) continue;
    out.push(`${p}: ${before[p]} → ${after[p]}`);
  }
  return out;
}

/**
 * The group of boxes that together show that something has the focus.
 *
 * The control is often invisible — a radio hidden by size and opacity so it
 * keeps its place in the tab order — and the ring is drawn on the *track*
 * that sits beside it. But the ring is just as often drawn on an **ancestor**:
 * a select inside a field gets its ring on the field, because the field is
 * what the reader is on. So the group is:
 *
 *   - the control itself;
 *   - the part that follows it, when that is the visual half of the control;
 *   - the labels that name it;
 *   - the library's own boxes around it, because a ring drawn on the field
 *     wrapper is the ring the reader sees.
 *
 * The ancestors are the ones the library owns — a box whose class starts
 * with `um-` — so the page around the component is not swept into the
 * comparison. A change on the page is not the library's focus treatment.
 */
function focusGroup(el) {
  const out = [el];

  const next = el.nextElementSibling;
  if (next && !next.matches("input,select,textarea,button,a,[tabindex]")) out.push(next);

  for (const l of labelsOf(el)) out.push(l);

  for (let node = el.parentElement; node && node.nodeType === 1; node = node.parentElement) {
    const cls = node.className;
    if (typeof cls === "string" && /(?:^|\s)um-[a-z0-9-]+/.test(cls)) out.push(node);
  }

  return out;
}

/** The labels that name a control. */
function labelsOf(el) {
  const out = [];
  if (el.labels) for (const l of el.labels) out.push(l);
  const holder = el.closest("label");
  if (holder && !out.includes(holder)) out.push(holder);
  return out;
}

/**
 * Every way this box can be telling the reader where they are.
 *
 * A focus indicator is not one thing. A control may paint a ring around
 * itself, a halo behind itself, or simply change the colour of its own
 * border — and the reader sees whichever of those reads. So the probe lists
 * every candidate the box offers and lets the best one win, rather than
 * measuring the first thing it finds. Measuring the first thing would call
 * a text field broken because its soft halo is faint, when the border that
 * halo sits on is perfectly readable.
 *
 * Where the indicator lands decides what it is measured against, and that
 * is not a detail:
 *
 *   - an outline with a **positive** offset is drawn outside the border box,
 *     so it sits on the parent's surface;
 *   - an outline with a **negative** offset is drawn inside it, so it sits
 *     on the element's own surface — the ring inside a tree row is on the
 *     row, not on the tree behind it;
 *   - a shadow without `inset` is drawn outside the box, and one with
 *     `inset` inside it;
 *   - a border that changed colour is the element's own edge, and is read
 *     against the element's own surface.
 */
function indicatorsOf(el, before) {
  const cs = getComputedStyle(el);
  const out = [];

  // A box the reader cannot see cannot tell them anything. The library hides
  // its radios by making them a pixel wide and transparent so they keep their
  // place in the tab order — and the browser still paints its own focus ring
  // around that pixel. Counting it would give every hidden radio a ring the
  // reader has never seen.
  if (parseFloat(cs.opacity) === 0) return out;
  const box = el.getBoundingClientRect();
  if (box.width < 4 || box.height < 4) return out;

  const ownBg = effectiveBackground(el);
  const parentBg = effectiveBackground(el.parentElement ?? el);

  const width = parseFloat(cs.outlineWidth) || 0;
  const offset = parseFloat(cs.outlineOffset) || 0;
  if (cs.outlineStyle !== "none" && width > 0) {
    const c = parse(cs.outlineColor);
    if (c) out.push({ kind: "outline", color: c, bg: offset < 0 ? ownBg : parentBg });
  }

  const shadow = cs.boxShadow;
  if (shadow && shadow !== "none") {
    const m = shadow.match(/rgba?\([^)]+\)/);
    if (m) {
      const c = parse(m[0]);
      const inset = /inset/.test(shadow);
      if (c) out.push({ kind: inset ? "inset shadow" : "shadow", color: c, bg: inset ? ownBg : parentBg });
    }
  }

  // A border that changed colour is an indicator too: the edge of the box
  // itself becomes the thing the reader sees.
  for (const side of ["border-top-color", "border-right-color", "border-bottom-color", "border-left-color"]) {
    if (!before || before[side] === cs.getPropertyValue(side)) continue;
    const c = parse(cs.getPropertyValue(side));
    if (c) out.push({ kind: "border", color: c, bg: ownBg });
  }

  return out;
}

/** The candidate that reads best against its own background. */
function bestIndicator(candidates) {
  let best = null;
  let bestRatio = -1;
  for (const c of candidates) {
    if (!c.color) continue;
    const fg = c.color.a < 1 ? over(c.color, c.bg) : c.color;
    const r = ratio(fg, c.bg);
    if (r > bestRatio) {
      bestRatio = r;
      best = { ...c, fg, ratio: r };
    }
  }
  return best;
}

/** The tag and classes of an element, for the report. */
function labelOf(el) {
  const cls = (el.className || "")
    .toString()
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .join(".");
  return el.tagName.toLowerCase() + (cls ? "." + cls : "");
}

/** The text of a node, with the runs of whitespace closed up. */
function textOf(node) {
  if (!node) return "";
  return (node.textContent ?? "").replace(/\s+/g, " ").trim();
}

/**
 * The name a screen reader would announce for a control.
 *
 * The order is the platform's order: the label the author wrote, then the
 * label another element points at, then the label a `<label>` element gives,
 * then the title, then — for the things whose name is their own text — the
 * text itself.
 */
function accessibleName(el) {
  const own = el.getAttribute("aria-label");
  if (own && own.trim()) return own.trim();

  const labelledby = el.getAttribute("aria-labelledby");
  if (labelledby) {
    for (const id of labelledby.split(/\s+/).filter(Boolean)) {
      const t = textOf(document.getElementById(id));
      if (t) return t;
    }
  }

  for (const l of labelsOf(el)) {
    const labelOwn = l.getAttribute("aria-label");
    if (labelOwn && labelOwn.trim()) return labelOwn.trim();
    const t = textOf(l);
    if (t) return t;
  }

  const title = el.getAttribute("title");
  if (title && title.trim()) return title.trim();

  // An image with an alt text names the thing it sits in.
  const img = el.querySelector("img[alt]");
  if (img && (img.getAttribute("alt") || "").trim()) return img.getAttribute("alt").trim();

  const tag = el.tagName.toLowerCase();
  const role = (el.getAttribute("role") ?? "").toLowerCase();
  if (NAME_FROM_TEXT_TAGS.has(tag) || NAME_FROM_CONTENT.has(role)) {
    const t = textOf(el);
    if (t) return t;
  }
  return "";
}

/** Is the element drawn at all? */
function isRendered(el) {
  if (el.checkVisibility && !el.checkVisibility()) return false;
  const style = getComputedStyle(el);
  if (style.display === "none") return false;
  return el.getClientRects().length > 0;
}

/** Is the control switched off? A disabled control is exempt from the rules. */
function isDisabled(el) {
  let node = el;
  while (node && node.nodeType === 1) {
    if (node.disabled) return true;
    if (node.getAttribute && node.getAttribute("aria-disabled") === "true") return true;
    if (node.inert) return true;
    node = node.parentElement;
  }
  return false;
}

/** Is the element outside the accessibility tree on purpose? */
function isHiddenFromReader(el) {
  let node = el;
  while (node && node.nodeType === 1) {
    if (node.getAttribute && node.getAttribute("aria-hidden") === "true") return true;
    node = node.parentElement;
  }
  return false;
}

// --- the rules the library wrote -----------------------------------------------

/**
 * Every rule the loaded stylesheets declare that has a focus in it.
 *
 * The rule is kept with the focus taken out of it — `.um-button:focus-visible`
 * becomes `.um-button` — so that the probe can ask the same question the
 * browser would have asked: does this rule reach this control? The question
 * is asked of the *group*, because the ring is often drawn on the sibling of
 * the control rather than on the control itself.
 */
function focusRules() {
  const out = [];
  const walk = (rules) => {
    for (const rule of rules) {
      if (rule.selectorText !== undefined) {
        if (rule.selectorText.includes(":focus-visible")) {
          out.push({
            selector: rule.selectorText,
            bare: rule.selectorText.replace(/:focus-visible/g, ""),
          });
        }
        continue;
      }
      if (rule.cssRules) walk(rule.cssRules);
    }
  };
  for (const sheet of document.styleSheets) {
    let rules;
    try {
      rules = sheet.cssRules;
    } catch {
      continue; // a sheet from another origin cannot be read
    }
    if (rules) walk(rules);
  }
  return out;
}

/** Does any of the library's focus rules reach this group? */
function hasLibraryRule(group, rules) {
  for (const rule of rules) {
    for (const m of group) {
      try {
        if (m.matches(rule.bare)) return true;
      } catch {
        // a selector the browser cannot parse is a selector that never applies
      }
    }
  }
  return false;
}

/**
 * Focus a control and read what changed.
 *
 * The reading is taken over the whole group, before and after, so a ring
 * drawn on a sibling counts as a ring. The browser's own default focus ring
 * is noticed separately: it is `outline: auto`, and a library that paints
 * nothing of its own leaves the reader with that.
 */
function measureFocus(el) {
  const group = focusGroup(el);
  const before = group.map(paint);
  const beforeOutline = getComputedStyle(el).outlineStyle;

  el.focus({ preventScroll: true });

  const focused = document.activeElement === el;
  const visible = focused && el.matches(":focus-visible");
  const after = group.map(paint);
  const afterOutline = getComputedStyle(el).outlineStyle;

  const candidates = [];
  for (let i = 0; i < group.length; i++) {
    if (!paintChanged(before[i], after[i])) continue;
    candidates.push(...indicatorsOf(group[i], before[i]));
  }
  const indicator = bestIndicator(candidates);

  const changed = group.map((b, i) => paintChanged(b, after[i]));
  const changedCount = changed.filter(Boolean).length;

  // What actually changed, said plainly: the probe's verdict is only as
  // good as its account of the picture it judged.
  const diffs = [];
  for (let i = 0; i < group.length; i++) {
    if (!changed[i]) continue;
    const d = paintDiff(before[i], after[i]);
    if (d.length) diffs.push(`${labelOf(group[i])}: ${d.join(", ")}`);
  }

  el.blur();

  return {
    focused,
    visible,
    changed,
    changedCount,
    diffs,
    indicator,
    beforeOutline,
    afterOutline,
    uaOnly:
      changedCount === 1 && changed[0] && afterOutline === "auto" && beforeOutline !== "auto",
  };
}

/**
 * Wait for the driver to put the browser in keyboard mode.
 *
 * The browser paints a `:focus-visible` ring only when the reader's last
 * interaction was a keypress. A probe that focuses with a script is asking
 * the browser a question it will answer "no" to, so the driver presses a
 * real Tab first and says so here. When the page is opened by hand and
 * nobody pressed a key, the wait runs out and the probe falls back to the
 * stylesheet rather than blaming the library.
 */
async function waitForKeyboard(timeoutMs = 8000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (window.__UM_KEYBOARD__) return true;
    await new Promise((r) => setTimeout(r, 50));
  }
  return false;
}

export async function measureKeyboard() {
  await loadStyles("whole");

  const keyboard = await waitForKeyboard();

  const catalogue = await fetch("/components/index.json").then((r) => r.json());
  const themeIndex = await fetch("/themes/index.json").then((r) => r.json());

  // Every component's live examples, lifted out of its documentation page.
  const chunks = [];
  for (const c of catalogue.components) {
    const html = await fetch(`/site/component/${c.id}.html`).then((r) => r.text());
    const doc = new DOMParser().parseFromString(html, "text/html");
    const section = document.createElement("section");
    section.dataset.component = c.id;
    for (const demo of doc.querySelectorAll(".example__demo")) {
      const box = document.createElement("div");
      box.className = "probe__demo";
      box.append(...demo.cloneNode(true).childNodes);
      section.append(box);
    }
    chunks.push(section);
  }

  const stage = document.getElementById("stage");
  const rules = focusRules();

  const rows = [];

  let measurements = 0;
  let focusables = 0;
  let focusVisible = 0;
  let named = 0;

  for (const theme of themeIndex.themes) {
    document.documentElement.setAttribute("data-um-theme", theme.id);
    // The attribute write is synchronous for the cascade, but the browser may
    // still be holding the old computed values; a forced layout settles it.
    void document.body.offsetHeight;

    for (const section of chunks) {
      stage.replaceChildren(section);
      const id = section.dataset.component;

      for (const el of section.querySelectorAll("*")) {
        if (el.tagName === "INPUT" && el.type === "hidden") continue;

        const role = (el.getAttribute("role") ?? "").toLowerCase();
        const mustReach = LEAF_ROLES.has(role);
        const tabbable = el.tabIndex >= 0;
        if (!tabbable && !mustReach) continue;

        if (!isRendered(el)) continue;
        if (isDisabled(el)) continue;
        if (isHiddenFromReader(el)) continue;

        // --- can the reader reach it? ---------------------------------------
        if (mustReach && !tabbable) {
          measurements++;
          rows.push({
            theme: theme.id,
            component: id,
            check: "role-unreachable",
            element: labelOf(el),
            detail: `it says role="${role}", but the keyboard cannot reach it`,
          });
          continue;
        }

        if (!tabbable) continue;

        focusables++;

        // --- can the reader name it? -----------------------------------------
        measurements++;
        const name = accessibleName(el);
        if (name) {
          named++;
        } else {
          rows.push({
            theme: theme.id,
            component: id,
            check: "no-accessible-name",
            element: labelOf(el),
            detail: "nothing names it: no aria-label, no label, no title, no text",
          });
        }

        // --- does the library paint a ring for it? --------------------------
        const group = focusGroup(el);
        const ruled = hasLibraryRule(group, rules);

        if (!ruled) {
          measurements++;
          rows.push({
            theme: theme.id,
            component: id,
            check: "focus-no-rule",
            element: labelOf(el),
            detail: "no rule in the library reaches it when it has the focus",
          });
          continue;
        }

        // --- can the reader see it? ------------------------------------------
        const m = measureFocus(el);
        if (m.visible) focusVisible++;

        if (!m.focused) {
          rows.push({
            theme: theme.id,
            component: id,
            check: "focus-refused",
            element: labelOf(el),
            detail: "it is in the tab order, but focusing it does nothing",
          });
          continue;
        }

        if (!m.changedCount) {
          rows.push({
            theme: theme.id,
            component: id,
            check: "focus-invisible",
            element: labelOf(el),
            detail: `focusing it changes nothing the reader can see — ${m.diffs.join(" | ") || "nothing visible changed"}`,
          });
          continue;
        }

        // --- can the reader read the ring? -----------------------------------
        if (!m.indicator || !m.indicator.color) continue;
        const fg = m.indicator.fg;
        const behind = m.indicator.bg;
        const r = m.indicator.ratio;
        measurements++;
        if (r < 3) {
          rows.push({
            theme: theme.id,
            component: id,
            check: "focus-contrast",
            element: labelOf(el),
            fg: hex(fg),
            bg: hex(behind),
            ratio: Number(r.toFixed(2)),
            need: 3,
            detail: `the ${m.indicator.kind} that shows the focus does not read against what it sits on — ${m.diffs.join(" | ") || "nothing visible changed"}`,
          });
        }
      }
    }
  }

  stage.replaceChildren();

  return {
    measurements,
    failures: rows.length,
    focusables,
    focusVisible,
    named,
    keyboard,
    rows,
  };
}
