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
- **Component state colors / derived alpha (deferred to v1.1)** — tokens
  define core colors but not badge/alert state fills. M3 showed agents tend to
  derive `rgba(accent, α)` variants; `token-only` checks catch them, but the
  clean expression belongs to a `components.badge|alert` semantic layer in
  v1.1. In v1, prefer solid `colors.accent/ok/warn/danger` fills over
  self-made alpha variants.

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

The specimen is now a shell plus 27 section partials. The new structure
changes what the old "single matrix template" caveat means:

- **Every mood renders every section** — the build injects all 27 partials
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
  contrast guarantees. A block that composes two surfaces in a new way (for
  example a badge on an accent fill) is not automatically re-validated.
