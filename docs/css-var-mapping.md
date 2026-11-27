# CSS Variable Mapping Convention

Status: v1.1 (sectioned specimen + app layer). Reference:
`UI-Moods-前置规划-v0.2.html` §6.2/§6.4 and Cursor review R01 (M1/M4).

## 1. Algorithm

Tokens path → CSS custom property:

```
--mood- + <group> + "-" + <field in kebab-case>
```

camelCase fields are converted to kebab-case (one `-` per uppercase letter).

| tokens path | CSS custom property |
| --- | --- |
| `colors.textStrong` | `--mood-colors-text-strong` |
| `effects.backdropFilter` | `--mood-effects-backdrop-filter` |
| `typography.bodySize` | `--mood-typography-body-size` |
| `radii.card` | `--mood-radii-card` |
| `spacing.section` | `--mood-spacing-section` |
| `shadows.card` | `--mood-shadows-card` |

## 2. Mapped groups

`colors`, `typography` (`family` / `displaySize` / `titleSize` / `bodySize` /
`labelSize`), `radii`, `borders`, `effects`, `shadows`, `spacing`, `motion`.

## 3. Exception list — token fields NOT injected into CSS

`build-specimen` skips these; agents still consume them from `tokens.json`.

| tokens path | Reason |
| --- | --- |
| `id`, `version` | metadata, not visual |
| `meta.*` | metadata (name/keywords/fonts are used for hero text, not CSS vars) |
| `typography.weights` | specimens hardcode weights; agents read weights from tokens |
| `effects.panelOpacity` | semantic "panel fill opacity" — compose it into `background-color` alpha (rgba), **never** the CSS `opacity` property (it would fade children, breaking frosted-glass panels) |

`components.*` is **no longer** an exception: since v1.1 the semantic layer is
injected as `--mood-components-*` (see §3.1).

## 3.1 Component semantic layer (v1.1)

`tokens.components` is the agent-facing layer: it names the *states* a product
needs (badge, alert) and the values each state is painted with. It maps to one
custom property per leaf:

```
--mood-components-<component>-<state>-<slot>
```

| tokens path | CSS custom property |
| --- | --- |
| `components.badge.ok.bg` | `--mood-components-badge-ok-bg` |
| `components.badge.ok.fg` | `--mood-components-badge-ok-fg` |
| `components.badge.ok.border` | `--mood-components-badge-ok-border` |
| `components.badge.ok.radius` | `--mood-components-badge-ok-radius` |
| `components.alert.warn.bg` | `--mood-components-alert-warn-bg` |

The values stay **references**, not literals: `components.badge.ok.bg` is
`{colors.ok}`, so the emitted property is
`--mood-components-badge-ok-bg: var(--mood-colors-ok)`. Colours remain owned by
`colors`; the component layer only names them. `buildCssVars` in
`tools/lib/mapping.mjs` emits the block, and both `build-specimen` and
`build-apps` use it, so the two layers cannot drift.

**States.** `badge` and `alert` each declare five states: `neutral`,
`accent`, `ok`, `warn`, `danger`. The class vocabulary follows the same names
— `.badge` (neutral), `.badge.accent`, `.badge.ok`, `.badge.warn`,
`.badge.danger`, and the matching `.alert.*` in the specimen / `.notice.*` in
the app layer. `.badge.live` is kept as an alias of `.badge.accent` so markup
copied from an earlier specimen still paints the same chip.

**Foreground derivation.** A solid state fill needs a foreground that is
readable on it, and a mood's own palette may not contain one — a light amber
`warn` with a white `onAccent` is unreadable. `tools/lib/state-colors.mjs`
derives one per state and stores it as a colour token:

| token | foreground for |
| --- | --- |
| `colors.onAccentSolid` | the `accent` fill |
| `colors.onOkSolid` | the `ok` fill |
| `colors.onWarnSolid` | the `warn` fill |
| `colors.onDangerSolid` | the `danger` fill |

The derivation is mechanical: take the mood's opaque palette as candidates,
keep the best contrast against the fill, and if that still misses the bar,
move it toward black or white until it passes. It aims at **4.6:1** while the
contract requires **4.5:1**, so the shipped pairs keep a margin — with one
exception that is a hard mathematical limit, not a defect: `forest`'s `danger`
(`#b05f47`, relative luminance 0.179) cannot reach 4.6 on *any* foreground,
because pure black gives 4.574 and pure white 4.591. Its shipped pair sits at
4.591, the ceiling of that fill.

`validate` enforces the contract: every state must exist, its references must
resolve, and its foreground must reach 4.5:1 against its fill.

`validate` also checks the **rendered** artifact — it resolves the generated
CSS the way a browser does (merged selector lists, `border` shorthand vs
`border-color`, later rule wins) and requires that each state is painted by
its own variables. A template that binds `.badge.warn` to the accent
variables would otherwise ship unnoticed: the tokens stay valid, the contrast
assertions stay green, and the page paints the wrong state. See
`tools/lib/render-check.mjs`.

## 3.2 Component layer — `--um-*` (v1.1)

The component library has its own vocabulary, and it is deliberately separate
from the mood's. The component CSS reads `var(--um-*)` and never
`var(--mood-*)`; a theme file translates one into the other.

The contract lives in **`tokens/roles.json`**:

| Key | What it holds |
| --- | --- |
| `roles` | 95 roles: how to read them from the mood (`from`), how to derive them (`derive`), and what each one is for (`doc`) |
| `pairs` | 68 contrast guarantees, each a foreground role, a background role and a minimum ratio |
| `componentConstants` | the 11 shape and layout constants the component layer declares itself |
| `optional` | roles a mood may leave out (`glow`, `backdrop`) |

### How a role is derived

| Op | Meaning |
| --- | --- |
| `from` | take the mood's value directly (`colors.textStrong` → `text-primary`) |
| `derive` | a fixed blend: `mix(base, bg-page, N/10)` for `soft-N`, `mix(base, text-primary, 0.2)` for `strong` |
| `contrast` | move the base toward `toward` **just far enough** to reach `target` against `against`. `against` may name several surfaces, and the result has to satisfy all of them |
| `fade` | the faintest a role may get while still reading: fade toward the surface, or — if fading cannot work — move away from it |
| `flatten` | composite a stack of translucent layers into the one opaque colour they actually paint |
| `on` | a foreground that reads on a fill, derived from the theme's own text colours |
| `weaken` | reduce a shadow's alpha, leaving its geometry alone |

Two details are worth stating outright, because both were found by measuring
rather than by reading:

- **The blend direction can be reversed.** A bright brand colour on a dark
  page has to get *darker* to read, and the only darker direction is away from
  the text colour. `contrast` therefore searches both directions and keeps the
  smaller move.
- **The test runs on the quantised colour.** A blend that measures 4.503 in
  floating point can come out as 4.496 once rounded to an 8-bit hex — and the
  hex is what the browser paints. Nine roles sat exactly on that knife edge
  before the check was moved.

### The effective surface

A translucent fill over a translucent container is a colour that **neither
token names**: the fill says "8% white", the container says "4% white", and
the text on both is sitting on something neither of them describes. Measured
against the fill alone, a disabled label in the frosted themes is at 1.56:1.

Two roles exist to name that surface:

- `surface-control` — `fill-base` over `bg-container` over `bg-page`
- `surface-input` — `fill-blank` over `bg-container` over `bg-page`

Both are flattened to one opaque colour, and the muted roles are derived
against them.

### The theme's scope, and why it has two selectors

Each theme file declares its variables under three selectors:

```css
:root,
:root[data-um-theme="anime"],
[data-um-theme="anime"] { … }
```

The three do three different jobs.

- `:root` is the **fallback**: a page that links exactly one theme file and
  names nothing still gets that mood.
- `:root[data-um-theme="anime"]` is the **document scope**, and it is one
  step more specific than `:root` on purpose. That single step is what lets
  several theme files sit on one page: the file whose id matches the
  attribute wins the cascade outright, whatever order the files were linked
  in, and the `:root` part of the other thirty-one cannot take it back.
- `[data-um-theme="anime"]` is the **subtree scope**: an element that claims
  a mood gets that mood's variables, and its own declarations beat the ones
  it would otherwise inherit.

The old version wrote `:root, [data-um-theme="anime"]` — one rule, both
selectors at the same specificity. It worked for one theme per page and
**could not** work for several: every theme file claimed `:root` equally, so
the last file linked won and no attribute could override it. Runtime
switching was therefore impossible without swapping a stylesheet, which costs
a network request.

With the scope one step more specific, `themes/all.css` can carry all 32
moods at once, and switching is an attribute write: a median of 1.4 ms over
96 switches, with no request at all.

### An optional role is still declared

`glow` and `backdrop` are optional — a mood may have no glow. But the theme
file still writes them, with the value the contract declares for an absent
optional role (`none`). A role that is simply missing from a declaration list
is a role that inherits from whichever theme file was linked after it, so a
mood with no glow would end up wearing another mood's glow. The symptom
appears only in the combined sheet and never in the single-file case, which
is exactly the kind of bug a screenshot of one theme cannot catch.

### Why `soft-N` and not `light-N`

Element Plus writes `light-3` as `mix(white, primary, 30%)`, which only holds
for a light theme. On a dark mood a hover state would end up lighter than the
page it sits on. Here `soft-N` is `mix(base, bg-page, N/10)` — it always
recedes toward the page — and `strong` is `mix(base, text-primary, 0.2)`, so it
deepens on a light theme and brightens on a dark one. One formula, 32 moods.

### The component layer's own allowlist

The component CSS is allowed `px` only for layout mechanics, and each value
has to be listed in **`schemas/component-allowlist.json`** with a reason:

| Value | Why |
| --- | --- |
| `1px` | the visually-hidden input that carries a control's checked state |
| `2px` | the spinner and thumb border width, the switch thumb's offset, the focus ring's width |
| `4px` | the tick mark's width |
| `5px` | the select chevron's background size |
| `6px` | the badge dot's diameter |
| `8px` | the tick mark's height |
| `-2px` | nudges the tick mark so it sits centred in its box |

Everything else — colour, radius, font size, spacing — is `var(--um-*)`.

### A component's own variable

A component may hold one value of its own, namespaced under the component's
id: `--um-button-label` holds the button's label colour, derived from a theme
role. The check in `tools/lib/component-check.mjs` allows such a variable only
when it is **declared in the component layer** (so a typo is still a typo) and
**namespaced under a real component id** (so it can never shadow a theme role
such as `--um-color-primary`).

It exists because of a measured defect. The loading spinner used to name the
brand colour directly, so a success button drew its spinner in the primary's
on-colour — 15 of 192 theme-and-variant combinations fell below 3:1, and the
worst was 1.28:1, which is a spinner you cannot see. The label colour now lives
in one variable that both the label and the spinner read, so the spinner is
exactly as legible as the label it replaced. Measured across all 32 moods: the
label's floor is 4.50:1 and the spinner's is 4.60:1.

### A role is only guaranteed on the surfaces it is contracted against

`text-placeholder` is the muted colour faded toward the input's own surface,
and it was contracted to clear 2.5:1 against `surface-input`, `bg-overlay` and
`bg-page`. The empty state paints its glyph on `fill-light` instead, and that
surface was in nobody's contract — so in four moods the placeholder landed at
2.31:1 to 2.48:1 on a surface the library actually uses.

The fix was not to move the glyph. It was to widen the contract: the role now
names every surface the component layer paints it on, `bg-container`,
`fill-light` and `fill-lighter` among them, and three new pairs hold it there.
The general rule this follows: **if the component layer uses a surface, the
contract has to know that surface.**

### A translucent surface is painted once

Knowing the surface is only half of it. A surface that is painted twice is a
colour no role names, and a guarantee made against one of the two layers is a
guarantee about a surface nobody sees.

Two components did that:

- **A table** painted `fill-blank` on the wrapper *and* on the table inside it.
  The cells sat on two translucent layers, and the empty cell's muted label
  fell to 3.20:1 in `glass`.
- **A bordered table of key and value** painted the *line* colour
  (`border-base`) as the container's background, so that the one-pixel gap
  between two cells draws the line. The cells painted `fill-blank` over it, and
  the line colour came through the cell: the label landed at 2.66:1 in
  `vaporwave` and 3.65:1 in `aurora`.

The table now paints its surface once — the wrapper owns it, and the table
inside it paints nothing. The bordered key and value table cannot do that,
because its line *is* a background; so its cell paints `surface-panel`, the
flattened colour of the fill over the page, in one opaque layer. The line stays
in the gap where it belongs, and the cell gets the colour it would have had
anyway.

Two rules follow:

1. **A translucent fill is painted once.** A frame that owns a surface paints
   it; the thing inside the frame paints nothing.
2. **A line colour never sits under a translucent cell.** A cell that has a
   line under it paints the flattened surface instead.

### What the browser painted

The contract is measured on roles. The library is rendered in a browser, and a
browser composites what is really on the page — so the pages are measured too.

`tools/probe/contrast.html` loads every component's live examples, walks the
whole document once per mood, and measures the colours the browser actually
painted: the foreground it resolved, and the background composited through
every layer between the element and the page. the current run is **51 328
measurements across 74 components and 32 moods, with zero failures**.

Four things the probe had to learn, each of them a false alarm in the first
place:

- **A colour can be written as hex.** The placeholder role is written as a hex
  in most moods. A probe that only understood `rgb()` read the role as
  missing, and held a placeholder to the bar for body text — 32 false
  failures across the empty state.
- **A panel that flies out of its parent leaves the parent's box behind.** A
  cascader's second level is positioned beside the first, so the first level's
  fill is not behind it. Counting that fill invents a stack the reader never
  sees.
- **The floor of every stack is the canvas.** The body's background propagates
  to the canvas, so it is what is behind everything — including a panel that
  has left the body's box entirely. A probe that found nothing there and
  fell back to white would measure every dark mood against a light surface.
- **A dimmed picture is not a disabled state.** A calendar day that cannot be
  picked was painted with the derived `text-disabled` colour, which the
  contract holds at 2:1 — the bar for a control the reader cannot use. But the
  probe could not tell that day was disabled, because the day carried a *class*
  and nothing else, so it held the day to the 4.5:1 of ordinary text and
  reported 64 failures across the 32 moods. The probe was right and the
  component was wrong: a class that paints a dimmed day does not tell a reader
  that the day is unavailable. The day now carries `aria-disabled="true"`, the
  way `um-link` does, and the library's own rule is that a disabled state is
  written in the markup and not only in the stylesheet.

### The audit is a command, not a ritual

The probe pages are measuring instruments, and a measuring instrument that
needs a person to open it in a browser and read the table is a check that
stops being run. `node tools/audit-render.mjs` drives the same page in a
headless browser over the DevTools protocol and prints the answer:

```
audit-render · component layer · contrast
  measurements: 22208
  failures: 0
```

The measurement is still the browser's — the page under `tools/probe/` does the
walking, and this command only reads the result the page publishes as
`window.__PROBE__`. The exit code is the verdict: 0 when the probe reported
nothing, 1 when it did, 2 when the run itself went wrong. A run that never
finished is reported as a run that never finished; it is never read as a clean
bill of health.

The same command with the word `apps` measures the app packs instead, and
reports the same 3 364 / 1 106 the in-browser run found — two independent
paths to the same number.

### The other instrument: geometry

A contrast probe cannot see a broken layout. A date grid laid out in seven
columns instead of one has colours that are perfectly readable and numbers
that lie on top of each other; the calendar component shipped exactly that
for a while, and the contrast probe reported zero failures on every one of
its sixty examples in all thirty-two moods.

`tools/probe/geometry.html` measures the boxes the browser laid out. The
current run is **115 488 measurements across 83 components and 32 moods, with
zero failures**, and it is a command in exactly the same way:

```
audit-render · component layout · geometry
  measurements: 93632
  failures: 0
```

Four things it had to learn, each of them a false alarm in the first place:

- **A dimmed picture is not the only way to be wrong.** A box that is exactly
  where it was asked to be can still hold a word that does not fit: a date
  number squeezed into a tenth of its cell keeps the box the layout gave it
  and spills the digits over its neighbour. The text's own ink box — measured
  with a range over the text node — is what shows it.
- **A rotated shape's box is bigger than the box it occupies.** A leaning
  slash turns a narrow rectangle into a wide diagonal. Comparing the
  transformed bounding box with the parent would report every decoration in
  the library as an overflow.
- **A closed disclosure's content is not in the disclosure's height.** The
  browser lays the content out and does not paint it, so its box sits below
  the box of the thing that holds it.
- **A skipped subtree is not painted either.** `content-visibility: auto`
  keeps a subtree out of the layout until it comes near the viewport, and
  its container holds a placeholder size rather than the real one. The
  content is genuinely taller than the box it sits in — that is what the
  browser is for.

And one thing it learned from the library's own semantics: **a row is a
row.** Two elements marked `role="row"` whose vertical ranges overlap are
laid out beside each other, which means the container above them has the
wrong number of columns. That is the check that finds the seven-column date
grid, and it finds it even when every box in it is exactly the size it was
asked to be.

A measuring instrument that has never been shown to fail is not known to
work, so the broken layout was put back on purpose: the probe reported 384
failures on it, and 0 once it was fixed again.

### The third instrument: motion

The library moves in two ways. Some of it moves on its own — a loading ring
turns, a skeleton shimmers — and some of it moves when the reader does
something: a button changes colour, a drawer slides, a carousel advances.

The first kind was already opt-in. Every animation the library starts by
itself is written inside `prefers-reduced-motion: no-preference`, so a reader
who has asked for less motion never sees it.

The second kind was not. Thirty-four transition rules — hover fills, focus
rings, the slide of a drawer — moved for everybody. WCAG asks for
interaction-triggered motion to be switchable off, and there was no way to
switch this one off.

So the library now answers it once, in `tools/lib/motion.mjs`: when the
reader has asked for reduced motion, the durations of every element the
library paints drop to **a hundredth of a millisecond**.

Not to zero. A transition of zero length never fires `transitionend`, and a
host that waits for that event to know a panel has finished moving would wait
for ever. A hundredth of a millisecond is short enough that nothing visibly
moves and long enough that the event still comes. The rule is generated from
the manifests, so it covers every component without anyone remembering to add
it, and it is scoped to the library's own elements — a host's own motion is
left alone.

The measurement is a command, and the preference has to be emulated where the
media query reads it, which is inside the browser:

```
audit-render · the motion contract · motion
  measurements: 3962
  failures: 0
  reader asked for reduced motion: true
  elements with a declared duration: 3959
  elements that visibly move: 0
```

The baseline is the number that makes it mean something — **371 elements
visibly move** when the reader has not asked otherwise. And the instrument was
shown to fail: with the motion rule taken out, the same run reported **362
failures** — every one of them an element moving for 0.4s, against a reader
who had asked for stillness.

### The fourth instrument: the published package

A library that is correct in the repository and broken in the tarball is a
library that is broken. The package therefore has its own check, and it does
not re-implement the resolver: it uses Node's own, resolving the package by
its own name through the `exports` field.

```
package: PASS — 206 public names resolved, 83 components and 32 moods published, Vue renders
```

That is 206 names — every component's Vue wrapper, every component's CSS
file, every mood's CSS file, and the fixed entries — each one resolved
through the public name a consumer would type, and each one checked to be
inside a directory `package.json` actually publishes. The Vue package is then
imported *through those names* and rendered with the server renderer, because
a package whose entry points resolve but whose components do not render is
still broken.

And the stylesheet is measured twice. `components/um-components.css` is the
whole sheet; `css/` is the same sheet cut into pieces — `base.css` once, then
one file per component, which is the shape Element Plus ships
(`theme-chalk/base.css` plus `theme-chalk/el-button.css`). Both are cut from
one chunk list, so they cannot drift, and the cut sheet is measured in the
browser the same way the whole sheet is:

```
audit-render · the published package · package
  measurements: 51328
  failures: 0
```

The same 51 328 measurements and the same zero failures. A host that links one
file per component gets the library the whole sheet would have given it.

### The fifth instrument: the rules the browser kept

Every instrument above asks a question about the *result*. This one asks about
the *stylesheet itself*: did the browser keep the rules the library declared?

It has to, because the browser throws a rule away without a word. A rule whose
selector it cannot parse is simply gone — the state that rule was to paint
never gets painted, and every other measurement still passes. The rating
component found this out the hard way. Its filled stars were drawn by

```css
.um-rate__item:nth-of-type(-n+var(--um-rate-filled)) .um-rate__active { opacity: 1; }
```

A custom property is substituted into a **declaration**. It is never
substituted into a selector, because a selector is read before any property
is known. So that was not a selector the browser could parse: the rule was
thrown away whole, every one of the twenty-one stars in the documentation
rendered empty, and the contrast probe, the geometry probe and the token
checks all passed — because nothing about the colours changed and nothing
about the boxes moved.

`tools/probe/validity.html` compares the rules the library *declares* with the
rules the browser *kept*:

```
audit-render · the rules the browser kept · validity
  measurements: 1164
  failures: 0
```

Two kinds of difference are not defects, and the probe knows them. The browser
writes a selector back in its own words — `:nth-child(even)` comes back as
`:nth-child(2n)` — so both sides are read the same way before they are
compared. And a selector carrying a vendor prefix is written on purpose for
whichever engine owns that prefix, so the engine that does not own it is
expected to drop it: `::-moz-range-thumb` is not a broken rule in Chrome, it
is the rule Firefox needs. A list that mixes a prefixed selector with an
ordinary one is still reported, because there the ordinary selector is lost
as well.

The instrument was shown to fail. With the broken rule put back, the same run
reported one failure and named it:

```
.um-rate__item:nth-of-type(-n+var(--um-rate-filled)) .um-rate__active
  — the browser cannot parse this selector, so it threw the whole rule away
```

### The sixth instrument: the states the reader sees

A rule can be perfectly valid and still paint nothing. It can lose a
specificity fight, be overridden by a later rule, or be aimed at a class the
markup does not carry. Nothing in the stylesheet is wrong, so no check of the
stylesheet can see it.

`tools/probe/state.html` asks the question the reader would answer: does the
selected thing look different from the unselected one? It compares a selected
control with its unselected twins — siblings of the same shape carrying no
state of their own — by the paint of the box and of everything inside it,
including its pseudo-elements, because the library draws its shapes rather
than types them. A check mark is a border and a rotation, and there is no
character anywhere near it.

```
audit-render · the states the reader sees · state
  measurements: 37
  failures: 0
```

The finding is not that one twin matches. It is that *every* twin matches: the
reader picks something and nothing on the screen changes. A rating shows why
the distinction matters — three of its five stars are filled, so the checked
star looks exactly like the two filled stars beside it, and that is right,
because what the reader sees there is a count rather than a highlight. The
rating is broken when the empty stars look like the filled ones too, and then
every twin matches.

With the broken rule put back, the probe reports six failures — one for each
group in the rating's own examples.

### The other half of the library: the app packs

The app packs are the other thing this repository renders: 14 product screen
sets, 60 screens, built from a mood's **own** tokens rather than from the
component layer's roles. They were never measured; the documentation used to
say an app pack "inherits its mood's contrast guarantees" and stop there.

`tools/probe/apps.html` loads every screen into an iframe and measures what
the browser painted: **3 364 measurements, 1 106 below the bar**. The failures
are not spread out — they are two habits, and both are the *mood's* habit
rather than the generator's:

| What the screen does | Failures | Worst |
| --- | --- | --- |
| A mood colour painted as text — `colors.muted`, `colors.accent`, `colors.ok`, `colors.danger` | 961 | 1.44 |
| A solid fill with the mood's own on-colour (`onAccent`, `onDangerSolid`, …) | 145 | 2.02 |

823 of the 961 are one token: `colors.muted`. It is below 4.5:1 as text in 20
of the 32 moods, and the app packs show it as often as the screens allow.

This is the same debt the component layer does *not* have, and the difference
is exactly what the derived roles are for: the component layer derives
`text-secondary` from the mood's muted colour and moves it toward the text
colour until it reads, and it derives `color-*-on` so that a solid fill has a
foreground that reads on it. The app layer paints with the mood's tokens as
they are, on purpose — it is the faithful picture of a mood, and a faithful
picture of a mood shows the mood's contrast.

So the number above is not a defect in the app generator. It is the size of
the mood palette's own contrast debt, measured. Repairing it is a decision
about the moods themselves, and it belongs to whoever owns the moods.

### Text has a bar, and a shape has a different one

The contract answers to two different questions. Text asks "can this be read?"
and the bar is 4.5:1, or 3:1 for large text. A shape asks "can this be seen?"
and WCAG puts that at 3:1.

The brand colours answer the first question well — `color-primary-on` on
`color-primary` clears 4.5:1 in every mood — and the second question badly.
Measured across all 32 moods, the raw status colours on a container:

| Role | Worst on `bg-container` | Moods below 3:1 |
| --- | --- | --- |
| `color-primary` | 1.43 | 3 of 32 |
| `color-success` | 1.63 | 7 of 32 |
| `color-warning` | 1.39 | 15 of 32 |
| `color-danger` | 2.02 | 3 of 32 |
| `color-info` | 2.45 | 4 of 32 |

A timeline node is the one place where the colour *is* the message: there is
no word beside the dot, so a dot at 1.39:1 is a status nobody can read. So the
vocabulary now has a second form of each status colour:

```
color-warning        — the fill form. A solid badge, a filled button.
color-warning-text   — the text form. Moved to clear 4.5:1 as writing.
color-warning-graphic — the shape form. Moved to clear 3:1 as a picture.
```

The graphic form is derived with the same `contrast` op the text form uses,
with `target: 3` and `against: [bg-page, bg-container]`. All ten new pairs
hold across all 32 moods, the worst of them at exactly 3.00:1.

### What the library does not promise

The boundary layer — the hairline around an input, the rule between two rows,
the tint of a hovered row — is **not** held to 3:1. Measured, `border-base`
sits at 1.00:1 on the page in the clay mood and never clears 3:1 in any of
them, and two fills in a flat palette are about 1.05:1 apart.

That is not an oversight; it is what Element Plus, Ant Design and every other
library do. A 1px border in `#dcdfe6` on white is 1.24:1, and nobody calls
those libraries inaccessible. The boundary is carried by the fill underneath
it, by the label beside it, and by the shape of the control — not by the line
alone.

What the library *does* promise is stated in the contract and enforced on
every mood:

- every text role clears its bar on every surface the component layer paints
  it on;
- every shape whose colour carries meaning on its own — the timeline node, the
  rating star — clears 3:1;
- every fill that text sits on clears 4.5:1.

So a table's header is identified by a **rule and a heavier label**, not by its
background: in the moods whose palette is nearly flat, no two fills are far
enough apart to do the job, and a header that relies on its background alone is
a header nobody can find. The header therefore takes the recessed fill, the
hovered row takes the light one, and a rule runs under the header.

### 3.3 The component manifest — one file per component

`components/<id>/manifest.json` is the only hand-written description of a
component. The schema is **`schemas/component.schema.json`**, and it is
strict: `additionalProperties` is `false` everywhere, so a key nobody
expected is an error rather than a silently ignored field.

| Key | What it holds |
| --- | --- |
| `id` `name` `nameZh` | identity; `id` is the directory name and the URL slug |
| `category` | the Element Plus category it is listed under |
| `element` | the native element it is built on — the answer to "can this be done without JavaScript?" |
| `class` | the base class, the modifier prefix and the part prefix |
| `variants` `sizes` `states` `parts` | what the component can be; each becomes a class |
| `props` `slots` `events` | the public API |
| `a11y` | the role, the keyboard behaviour and the guarantees |
| `examples` | the live examples, with their markup |

From that one file the build derives:

```
components/<id>/manifest.json
   ├── →  components/um-components.css   (assembled from the style partials)
   ├── →  site/component/<id>.html        (the documentation page)
   ├── →  types/index.d.ts                (the type declarations)
   └── →  components/index.json           (the catalogue)
```

Two rules make the agreement enforceable rather than aspirational:

- **A variant the stylesheet never paints is an error.** The build checks
  every class the manifest claims against the CSS.
- **A stylesheet that is out of date with its partials is an error.**
  `validate` reassembles the sheet and compares, so a stale
  `um-components.css` cannot ship.

The manifest is framework-neutral on purpose: a CSS generator reads the class
names, a component generator reads the variant and prop names. The same file
describes the plain-HTML library today and a Vue 3 wrapper tomorrow.

## 4. Specimen-dependent keys

The component matrix requires these keys to exist in every mood; `validate`
enforces them:

- `colors`: `bg` `panel` `surface` `text` `textStrong` `muted` `border` `accent` `ok` `warn` `danger` (+ recommended `onAccent`)
- `radii`: `block` `button` `card` `badge` `input`
- `spacing`: `section` `block` `gap`
- `shadows`: `card` `button` (schema now requires both — Cursor review M6)
- `effects.backdropFilter` (may be `none`)
- `borders`: `width` `style`
- `typography`: `family` `displaySize` `titleSize` `bodySize` `labelSize`

## 5. Allowed hardcoded literals (validate allowlist)

The allowlist lives in **`schemas/allowlist.json`** so it can be reviewed in
one place. Theme parameters (colors / radii / shadows / fonts) are **never**
allowlisted — they must resolve to `var(--mood-*)`. Only *layout mechanics* may
appear as literals.

`validate` scans the specimen **excluding** the `style#mood-tokens` block (that
block is generated from tokens and is exempt).

| Category | Allowed values | Rationale |
| --- | --- | --- |
| `font-size` | `10px` `11px` `12px` `13px` | Auxiliary text only (labels, meta, captions). Primary sizes come from `var(--mood-typography-*)`. |
| `letter-spacing` | `0.06em` `0.08em` `0.1em` `0.12em` | Labels and marks only. |
| `opacity` | `0.4` `0.45` `0.6` `0.7` `0.75` | Disabled / meta-hint states only. |
| `font-weight` | `400` `500` `600` `700` | Weights are not injected as CSS variables; these are the values `tokens.typography.weights` may declare. |
| `border-radius` | `999px` only | **Raw radii are otherwise forbidden** — a radius must resolve to `var(--mood-radii-*)`. `999px` is the pill exception. Percentages (`50%`) are not px literals and are allowed. |
| Pixel metrics | any integer `0`–`100`; plus `104, 112, 120, 128, 144, 160, 180, 200, 220, 240, 260, 280, 300, 320, 360, 400, 420, 440, 480, 520, 560, 600, 640, 680, 720, 760, 800, 860, 880, 920, 999` | Layout rhythm: box geometry, offsets, grid tracks, media sizes. |
| Color literals (outside token block) | none — must be `var(--mood-colors-*)` or keywords `transparent` `currentColor` `inherit` `none` | Hard rule. |

Pixel metric buckets (for maintainers adding to the template):

- **Control geometry**: switch track `42×24`, knob `18` at `top/left 3` / on `21`; progress `8px` + radius `999px`; chip `44px`; logo glyph `36px`; swatch `72px`; type spec column `76px`; textarea `72px`.
- **Page chrome**: hero padding `48/36`, kit padding `28/36/48`, hero `max-width 640px`, breakpoint `860px`.
- **Micro spacing**: `0 3 4 6 8 9 10 12 14 16 18 20 24 28` (margins/gaps/paddings).

Any new literal must be added here with justification before `validate` passes.

### 5.1 Section partials

The specimen is assembled from `templates/mood/sections/*.html`, injected in
filename order at the `{{sections}}` marker of the shell
(`templates/mood/specimen.html`). Each partial may carry its own `<style>`
block.

Partial rules:

- Prefix every new class with `s-` so it cannot collide with the shell's
  classes or with another partial's.
- A partial may only use `var(--mood-*)` for theme parameters — the same rule
  as the shell.
- The literal rules in §5 apply to partials exactly as they apply to the shell.
- Sections are numbered so the injection order is stable: `01-…` → `27-…`.

### 5.2 App screens

App screens are generated by `tools/build-apps.mjs` from
`templates/app/app.css` plus `tools/lib/blocks.mjs`. The same token rules
apply: no color literals outside the token block, no raw `border-radius`
literals, no `<script>`, and every visual parameter comes from the referenced
mood's tokens.

### 5.3 Code-generated artwork

The library ships **no image assets**. Every "picture" — a product shot, a
cover, a banner, a gallery thumbnail — is drawn at render time by
`tools/lib/artwork.mjs` from the mood's own tokens.

- `renderArtwork(palette, seed, opts)` draws one generated region. The seed
  selects a composition family and a deterministic pseudo-random layout, so the
  same seed always produces the same picture and different seeds produce
  different ones.
- Composition families: `mesh`, `arch`, `rings`, `bars`, `tiles`, `dots`,
  `waves`, `rays`, `steps`, `petal`, `strata`, `orbit`. Small canvases
  (under 140 units on the short side) draw only from the soft subset
  (`mesh`, `strata`, `orbit`, `waves`).
- `renderMoodThumb` and `renderAppThumb` draw a miniature UI scene for the
  gallery cards.

Two rules keep a thumbnail honest about where its content is:

1. A composition is drawn at the origin, so it must be **moved onto** the clip
   rect it belongs to (`<g transform="translate(x,y)">`). Composing it at the
   clip rect's size but not its position leaves only the composition's
   top-left corner visible — the picture looks offset up and to the left.
2. A thumbnail that fills a card must not carry a corner radius of its own.
   The card's `border-radius` already rounds the corners; a second radius
   renders at a different size and leaves a wedge of background in every
   corner. `renderAppThumb` therefore takes a `frame` option: `"device"` draws
   a rounded phone with a bezel (for a thumbnail floating on a panel),
   `"bleed"` fills the box edge to edge (for a card that owns the radius).

Two rules keep the output inside the token contract:

1. Colour is never written in the generator. The caller passes a palette whose
   values are either `var(--mood-colors-*)` references (inside a mood artifact)
   or concrete values read from `tokens.json` (in the gallery chrome, which is
   not itself a mood artifact).
2. SVG presentation attributes do not accept `var()`, so every paint goes
   through `style="fill:…"`. Opacity rides on its own attribute
   (`opacity="0.5"`, `stop-opacity="0.5"`) rather than a CSS declaration, so it
   never collides with the stylesheet opacity allowlist.

Everything in the markup is unitless — no `px` appears — so generated artwork
cannot trip the pixel allowlist. Gradient ids always begin with a non-hex
letter, so `url(#…)` can never be mistaken for a colour literal.

App screens reach the generator through the `artwork` block and the `art` /
`artSeed` props on `card`, `mediaGrid`, `carousel`, `list` and `banner`.
Specimen sections use the `{{art:seed}}` marker, replaced by `build-specimen`.
Each app pack's generated `screens/index.html` draws a cover plus one
miniature phone per screen, so the pack directory page is a gallery rather than
a bare list of links.

## 6. Extension note (v0.2.1)

- `colors.onAccent` added as a **recommended extended color key** (text/icon
  color on accent fills). The schema already permits additional color keys, so
  this is an allowed per-mood extension; specimens fall back to `surface` when
  absent.
- `effects.panelOpacity` semantic is documented above and must not be applied
  via the CSS `opacity` property.
- `effects.glow` is consumed by `.badge.accent` (`box-shadow`); moods without a
  glow simply declare no `glow` key.
- `.card-demo` and `.alert` also consume `effects.backdropFilter` (harmless
  when `none`), so frosted surfaces render consistently with `.block`.

## 7. Specimen regeneration rules (M3)

- `moods/<id>/specimen.html` is **generated output**: never hand-edit it.
  Always run `ui-moods build-specimen <id>` and commit the regenerated file.
- `build-specimen` accepts multiple ids: `ui-moods build-specimen glass night`.
- Section structure lives in `templates/mood/sections/`; the shell lives in
  `templates/mood/specimen.html`. Mood-specific DOM/CSS is out of scope; the
  matrix is the only specimen structure.
- HTML comments inside a section must **not** contain the literal
  `<style id="mood-tokens">` opening tag (it breaks `build-specimen`'s
  injection regex). Refer to it as "the `style#mood-tokens` block" instead.

## 8. Optional-token fallback convention

The template may reference optional token groups (`effects.*`, extended color
keys such as `onAccent`). Every such usage must carry a CSS fallback so moods
that omit the key still render and pass validate:

- `box-shadow: var(--mood-effects-glow, none);`
- `backdrop-filter: var(--mood-effects-backdrop-filter, none);`
- `color: var(--mood-colors-on-accent, var(--mood-colors-surface));`

**Fallback allowlist (frozen):** only these variables may use a fallback to
skip declaration — `--mood-effects-glow`, `--mood-effects-backdrop-filter`,
`--mood-colors-on-accent`. `validate` treats a fallback on these as safe even
when the token is not declared; any **other** `var(--mood-*, …)` with a
fallback is an error (it could mask a missing required token). Required
variables must be declared in `#mood-tokens` and used without fallback.

## 9. Pixel metrics — fractional values

Fractional lengths are handled by **where they appear**, not globally:

1. **In tokens** — fractional lengths are allowed (`borders.width`, shadows,
   etc.). `luxury` uses `0.5px` hairlines and `anime` uses `2.5px` outlines by
   design; the schema treats these as free strings.
2. **In specimen body CSS** — only the integer values listed in the §5 pixel
   allowlist may appear as raw literals. A fractional raw literal needs an
   explicit §5 entry; prefer `var(--mood-*)` references, which reach the
   specimen through `style#mood-tokens` (exempt from the magic-number scan).

## 10. App layer — how screens stay token-pure

An app pack declares screens as data. `tools/lib/blocks.mjs` maps each block
type to markup; `templates/app/app.css` carries the shared screen styles.

- Block renderers may only emit `var(--mood-*)` references for theme values.
  Semantic tones (`ok` / `warn` / `danger` / `accent` / `up` / `down`) are
  mapped to token colors in the stylesheet — a block never names a color.
- Icons are inline SVG paths drawn with `currentColor` (`tools/lib/icons.mjs`).
  No icon font, no CDN, no emoji as a primary glyph.
- A screen's `chrome` (`statusbar` / `navbar` / `tabbar`) is app-wide by
  default; a screen may override the navbar to get a back-arrow bar.
- `app.json` is the authoritative form. The rendered `screens/*.html` are
  generated output — never hand-edit them.
