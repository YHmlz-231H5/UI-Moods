# Known fidelity gaps (v1)

The single matrix template (12 sections) intentionally trades pixel fidelity
for consistency and agent-friendliness. Known, accepted gaps:

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

## Per-mood template losses (11 moods)

The single matrix template cannot carry every gallery decoration. One line per
mood, accepted for v1:

| Mood | Known template loss (v1) |
| --- | --- |
| anime | halftone dots, sparkles, candy gradient hero |
| archive | stamp texture, dashed edge accents |
| blueprint | drafting grid backdrop, ruled lines |
| clay | organic blob decoration, pressed-clay motion |
| forest | wood grain, leaf decorations |
| glass | gradient light blobs, multi-layer hero orbs |
| instrument | dual-font axis (display vs controls), tick/grid decorations |
| ios | grouped-list section insets, notch phone decoration |
| luxury | asymmetric editorial display composition, generous whitespace layout; `surface: transparent` reads as flat in the single-matrix card |
| night | dual-font axis, CRT-style glow backdrop |
| verdant | scanlines, striped terminal progress |

Dual-font axis affects `instrument` and `night`; v1 exposes only
`typography.family` (a `displayFamily` key may land in v1.1).
