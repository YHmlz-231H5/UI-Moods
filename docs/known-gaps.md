# Known fidelity gaps (v1)

The single matrix template intentionally trades pixel fidelity for
consistency and agent-friendliness. Known, accepted gaps:

- **Instrument dual-font** — the gallery prototype used Space Grotesk for
  display + JetBrains Mono for controls; `tokens.typography.family` supports
  only one family in v1. The mono character is preserved; an optional
  `displayFamily` may land in v1.1 if fidelity demands it.
- **Glass decorations** — gradient light blobs and multi-layer hero ornaments
  are not part of the matrix; the frosted panel/blur semantics are.
- **Clay motion** — the "pressed clay" micro-interaction is not modeled;
  `tokens.motion` carries duration/easing for agents to apply.
- **Contrast model** — nested multi-layer translucency and backdrop gradients
  are not simulated; prefer opaque pairs in `checklist.yaml` contrast items.
- **Component state colors / derived alpha (closed in v1.1)** — in v1 the tokens
  defined core colors but no badge/alert state fills, and M3 showed agents tend
  to derive `rgba(accent, α)` variants; the `token-only` checks catch them, but
  the clean expression belonged to a semantic layer. v1.1 ships that layer:
  `components.badge` and `components.alert` each declare five states
  (`neutral` `accent` `ok` `warn` `danger`), every state is emitted as
  `--mood-components-*`, and each foreground is derived from the mood's own
  palette to reach 4.5:1 against its fill (see `docs/css-var-mapping.md`
  §3.1). Agents no longer need to invent an alpha variant.

## Per-mood template losses

The single matrix template cannot carry every gallery decoration. One line per
mood, accepted for v1:

| Mood | Known template loss (v1) |
| --- | --- |
| anime | halftone dots, sparkles, candy gradient hero |
| archive | stamp texture, dashed edge accents |
| aurora | animated gradient mesh, particle drift |
| bauhaus | primary-color block compositions, rotated geometry |
| blueprint | drafting grid backdrop, ruled lines |
| brutal | raw HTML/canvas edges, inverse-video sections |
| clay | organic blob decoration, pressed-clay motion |
| corporate | dense grid table variants, inline sparklines in KPI tiles |
| crypto | ticker tape, candlestick charts, blinking cursor |
| eco | leaf/moss texture, hand-drawn illustration |
| fashion | asymmetric editorial display composition, generous whitespace layout |
| food | food photography, steam/drip illustration |
| forest | wood grain, leaf decorations |
| gaming | animated HUD chrome, hex-grid texture |
| glass | gradient light blobs, multi-layer hero orbs |
| instrument | dual-font axis (display vs controls), tick/grid decorations |
| ios | grouped-list section insets, notch phone decoration |
| luxury | asymmetric editorial display composition, generous whitespace layout; `surface: transparent` reads as flat in the single-matrix card |
| medical | anatomical illustration, vital-sign waveform |
| monochrome | texture and depth — a greyscale palette leaves nothing for surface treatment to carry |
| neon | glow bloom animation, chromatic aberration |
| night | dual-font axis, CRT-style glow backdrop |
| nordic | photographic texture, muted illustration |
| pastel | soft-focus blobs, grain texture |
| retro | halftone printing, paper distress |
| sakura | falling-petal animation, soft-focus bokeh |
| swiss | extreme grid discipline (the matrix is looser than true Swiss) |
| travel | destination photography, map tiles |
| vaporwave | grid horizon, sun-stripe motif, chromatic wobble |
| verdant | scanlines, striped terminal progress |
| y2k | chrome bevels, glossy gradients, sparkle overlays |

Dual-font axis affects `instrument` and `night`; v1 exposes only
`typography.family` (a `displayFamily` key may land in v1.1).

---

## Specimen-layer gaps (v1.1)

The specimen is now a shell plus 28 section partials. The new structure
changes what the old "single matrix template" caveat means:

- **Every mood renders every section** — the build injects all 28 partials
  into all 32 specimens. There is no per-mood section selection, so a mood
  that has no meaningful calendar content still shows a calendar section.
  Per-mood section opt-out is not modelled.
- **Section partials are static markup** — they are hand-authored compositions
  with their own scoped CSS (`s-` prefixed class names). They are not a runtime
  component library and they do not share a block vocabulary with
  `tools/lib/blocks.mjs`; the two layers can drift.
- **One appearance per specimen** — a mood ships either a light or a dark
  appearance, never both, so a specimen cannot demonstrate the same token set
  in two contrast environments.
- **Sections are composed, not interactive** — controls are non-functional
  by contract (no `<script>`, no `onclick`). The specimen shows states, it
  does not run them.

---

## App-layer gaps (v1.1)

The app pack layer renders real product surfaces, so its limits are different
from the specimen's:

- **Static screens** — a screen is a fixed composition, not an interactive
  state machine. There is no navigation between screens, no scroll-linked
  behaviour and no gesture handling. Screens are reference stills, which is
  what the token-only contract can honestly promise.
- **One mood per app** — an app pack binds to exactly one mood. It cannot
  show a light and a dark variant of the same product.
- **Block vocabulary, not a component API** — the 48 block types cover the
  common mobile patterns but are not a general-purpose component library.
  Patterns outside the vocabulary need a new block type in
  `tools/lib/blocks.mjs`.
- **No data realism** — figures are plausible but fictional. The screens
  demonstrate layout and hierarchy, not real backend contracts.
- **390 × 844 frame only** — one device size is rendered. The frame is fluid
  in width but the layout does not reflow for tablets or foldables.
- **Contrast is inherited, not re-checked** — an app pack inherits its mood's
  contrast guarantees. The *state* fills are re-checked, because the semantic
  layer ships its own foregrounds (a badge on an accent fill is now measured,
  not assumed), but a block that composes two surfaces in some other new way is
  still not automatically re-validated.
- **The screens have been measured, and the mood's palette has not passed**
  — `tools/probe/apps.html` loads all 60 screens and measures what the browser
  painted: 3 364 measurements, 1 106 below the bar. 961 of them are a mood
  colour painted as text (`colors.muted` accounts for 823 of those) and 145
  are a solid fill with the mood's own on-colour. The app packs show the mood
  as it is, on purpose, so this is the size of the *mood palette's* debt
  rather than a defect in the generator — but it is a number now, and it was
  a promise before.
- **No photography — generated covers instead** — the library ships no image
  assets, so product shots, dish photos and album covers are replaced by
  abstract compositions drawn from the mood's tokens
  (`tools/lib/artwork.mjs`). They read as a consistent set of cover art, but
  they are not the subject of the product. A mood that wants real imagery
  would need an external asset pipeline, which the token-only contract
  deliberately excludes.
- **One frame size, no motion** — a screen is a static 390 × 844 composition.
  There is no carousel physics, no scroll-linked parallax and no gesture
  handling; the contract is markup without scripts.

---

## Component-layer gaps (v1.1)

The component library is new, and the honest limits are these:

- **83 components so far, covering all 82 Element Plus components** — the
  library started with fifteen (button, input, textarea, select, field, switch,
  checkbox, radio, slider, badge, tag, alert, card, progress, empty, divider,
  skeleton) and now covers the whole Element Plus surface: Basic, Form, Data,
  Navigation, Feedback and Others, plus the one Configuration component. The
  `input` manifest covers Input and Select; the `field` manifest covers Form
  and Form Item; and two of the manifests — `checkbox-group` and
  `radio-group` — are forms Element Plus does not list separately.
  `docs/component-parity.md` lists all 82 against what is here, and names the
  three places where the answer is not "the same as EP's".
- **No JavaScript, so no composed components** — a dialog, a dropdown and a
  tooltip need behaviour that `:checked` and `:focus-within` can only partly
  provide. The library ships the parts that can be expressed in CSS and leaves
  the rest to the host.
- **The app packs are not built from the components** — `apps/` still renders
  through `templates/app/app.css`. Migrating them is mechanical (the classes
  exist) but it is a separate piece of work, and until it happens the two
  layers can drift.
- **The guarantees assume a known surface** — the contract measures text
  against the page, an overlay, a container and the library's own control
  fills. A host that stacks a component inside a surface the library does not
  know about (a coloured panel, a photograph) is outside what is measured.
  `surface-control`, `surface-input`, `surface-panel` and
  `surface-table-header` name the stacks the library does know, each flattened
  to one opaque colour. The library's own derived fills (`fill-base`,
  `fill-light`, `fill-lighter`) are covered for the roles the component layer
  paints on them; a role added later has to name them too, or the contract
  has a hole in it that only shows up on one surface.
- **The rendered pages are measured, the host's page is not** — the probe
  measures what the library renders on its own documentation pages, across all
  32 moods: 51 328 measurements, zero failures. A host that puts the library
  on a surface the library does not know is outside that measurement.
- **The package is checked, but it is not published** — the tarball is
  correct: 206 public names resolve through the `exports` map, the Vue package
  imports through those names and renders, and the split stylesheet in `css/`
  measures the same 51 328 times with the same zero failures as the whole
  sheet. What has not happened is `npm publish`; until it does, the library is
  consumed from the repository or from a local `npm install ./path`.
- **Motion is reduced, not removed** — when a reader has asked for reduced
  motion, the library's durations drop to a hundredth of a millisecond rather
  than to zero, because a zero-length transition never fires `transitionend`.
  A host that *requires* the event to fire will see it; a host that requires
  the transition to be absent from the computed style will not. The probe
  measures the visible duration, which is the thing the reader sees.
- **There is no scrim role, so an overlay has nothing to dim with** — a dialog,
  a drawer and a tour all want a curtain between them and the page. The library
  has no role for it: `bg-overlay` is the *panel's* own surface, not a curtain,
  and painting one with it would put two layers of the same colour on top of
  each other — a colour no role names. Adding a mood-level scrim means adding
  a token to all 32 moods, which is a change to the moods' look and not the
  library's to make on its own. Until then the overlays are the library's
  "floating panels carry no curtain" convention, and the modal form of a
  dialog leans on the browser's own `::backdrop`.
- **A scrollbar's thumb cannot be measured everywhere** — in WebKit the thumb
  is a pseudo-element, and the probe walks real elements, so it never sees it.
  Firefox has `scrollbar-width` but no way to theme the thumb's colour. The
  `scrollbar` component therefore carries its own `--um-scrollbar-size` and
  paints what it can paint, and the thumb's contrast is not in the contract.
- **A mood's own colours are not repaired** — in 20 of the 32 moods
  `colors.muted` is below 4.5:1 as text, and `colors.border` is a hairline in
  several more. The library routes around them with derived roles; it does not
  change the mood. A mood that wants its own muted colour to be readable has
  to change the mood.
- **The theme files are static** — `themes/<id>.css` is generated once from
  `moods/<id>/tokens.json`. Changing a mood means regenerating the themes
  (`ui-moods build-themes`), not editing the CSS by hand. What a *host* does
  with a theme is not static, though: `themes/all.css` carries all 32 moods
  at once and the mood in force is one attribute on the document, so a
  runtime switch costs no request and a median of 1.4 ms.
- **The Vue 3 package exists, but it is thin** — `vue/` ships one wrapper per
  component, generated from the same manifests as the CSS, and every wrapper is
  checked against its manifest by `tools/check-vue.mjs`. It applies the
  variant and size classes, exposes the manifest's props and puts the caller's
  content in a slot; it re-implements nothing. There is no build step (the
  wrappers are render functions), no test suite and no published package, and
  a component whose behaviour needs JavaScript still needs the host to write
  it. A project that wants no framework can skip the package entirely: link
  `components/um-components.css` and `themes/all.css`, write the `um-`
  classes, and switch the mood by setting one attribute.
- **The documentation site is generated, not written** — every page comes
  from a manifest, which is what keeps it honest, but it means a component
  whose behaviour deserves prose has to put that prose in its manifest's
  `notes`. The site has no search, no version switcher and no per-component
  anchors yet.
- **Accessibility is a contract, not an audit** — the manifests state the
  native element, the role and the keyboard behaviour, and `validate` checks
  that the states exist in the stylesheet. Nobody has yet run a screen reader
  over the library, and there is no automated axe-style check.
