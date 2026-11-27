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

- **15 components so far, 17 Element Plus equivalents** — button, input,
  textarea, select, field, switch, checkbox, radio, slider, badge, tag, alert,
  card, progress, empty, divider, skeleton. The `input` manifest covers Input,
  Textarea and Select, and the `field` manifest covers Form and Form Item.
  Tabs, table, dialog, dropdown, menu, pagination, avatar, tooltip
  and message are the next batch. A component that does not exist yet cannot be
  themed, only hand-built.
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
  `surface-control` and `surface-input` name the two stacks the library does
  know, both flattened to one opaque colour. The library's own derived fills
  (`fill-base`, `fill-light`, `fill-lighter`) are covered for the roles the
  component layer paints on them; a role added later has to name them too, or
  the contract has a hole in it that only shows up on one surface.
- **A mood's own colours are not repaired** — in 20 of the 32 moods
  `colors.muted` is below 4.5:1 as text, and `colors.border` is a hairline in
  several more. The library routes around them with derived roles; it does not
  change the mood. A mood that wants its own muted colour to be readable has
  to change the mood.
- **The theme files are static** — `themes/<id>.css` is generated once from
  `moods/<id>/tokens.json`. Changing a mood means regenerating the themes
  (`ui-moods build-themes`), not editing the CSS by hand.
- **No Vue 3 package yet** — the component layer is plain HTML and CSS. The
  manifest is framework-neutral on purpose, so a Vue wrapper can be generated
  from the same files later, but it does not exist yet and the repository has
  no build toolchain, no peer dependencies and no published package.
- **The documentation site is generated, not written** — every page comes
  from a manifest, which is what keeps it honest, but it means a component
  whose behaviour deserves prose has to put that prose in its manifest's
  `notes`. The site has no search, no version switcher and no per-component
  anchors yet.
- **Accessibility is a contract, not an audit** — the manifests state the
  native element, the role and the keyboard behaviour, and `validate` checks
  that the states exist in the stylesheet. Nobody has yet run a screen reader
  over the library, and there is no automated axe-style check.
