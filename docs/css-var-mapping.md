# CSS Variable Mapping Convention

Status: frozen for M1. Reference: `UI-Moods-前置规划-v0.2.html` §6.2/§6.4 and
Cursor review R01 (M1/M4). Schema extensions are noted in the last section.

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
| `components.*` | agent-facing semantic layer; a `--mood-comp-*` CSS mapping is deferred (not in v1) |

## 4. Specimen-dependent keys

The fixed component matrix (12 sections) requires these keys to exist in every
mood; `validate` enforces them:

- `colors`: `bg` `panel` `surface` `text` `textStrong` `muted` `border` `accent` `ok` `warn` `danger` (+ recommended `onAccent`)
- `radii`: `block` `button` `card` `badge` `input`
- `spacing`: `section` `block` `gap`
- `shadows`: `card` `button` (schema now requires both — Cursor review M6)
- `effects.backdropFilter` (may be `none`)
- `borders`: `width` `style`
- `typography`: `family` `displaySize` `titleSize` `bodySize` `labelSize`

## 5. Allowed hardcoded literals (validate allowlist)

Theme parameters (colors/radii/spacing-scale/fonts/effects/motion) must come
from tokens. Layout mechanics and utility states may stay hardcoded; any
literal not listed here is a validate error until added with justification.

`validate` scans the specimen **excluding** the `style#mood-tokens` block (that
block is generated from tokens and is exempt). Categories and exact values:

| Category | Allowed values (as used in the specimen template) |
| --- | --- |
| `font-size` | `10px` `11px` `12px` `13px` (auxiliary text only; primary sizes come from tokens) |
| `letter-spacing` | `0.06em` `0.08em` `0.1em` `0.12em` (labels/marks only) |
| `opacity` | `0.4` `0.45` `0.6` `0.7` `0.75` (disabled / meta hints only) |
| Pixel metrics | `0` `3` `4` `6` `8` `9` `10` `12` `14` `16` `18` `20` `21` `24` `28` `36` `42` `44` `48` `72` `76` `640` `860` `999` |
| Color literals (outside token block) | none — must be `var(--mood-colors-*)` or keywords `transparent` `currentColor` `inherit` `none` |

Pixel metric buckets (for maintainers adding to the template):

- **Control geometry**: switch track `42×24`, knob `18` at `top/left 3` / on `21`; progress `8px` + radius `999px`; chip `44px`; logo glyph `36px`; swatch `72px`; type spec column `76px`; textarea `72px`.
- **Page chrome**: hero padding `48/36`, kit padding `28/36/48`, hero `max-width 640px`, breakpoint `860px`.
- **Micro spacing**: `0 3 4 6 8 9 10 12 14 16 18 20 24 28` (margins/gaps/paddings).

Any new literal must be added here with justification before `validate` passes.

## 6. Extension note (v0.2.1)

- `colors.onAccent` added as a **recommended extended color key** (text/icon
  color on accent fills). The schema already permits additional color keys, so
  this is an allowed per-mood extension; specimens fall back to `surface` when
  absent.
- `effects.panelOpacity` semantic is documented above and must not be applied
  via the CSS `opacity` property.
- `effects.glow` is consumed by `.badge.live` (`box-shadow`); moods without a
  glow simply declare no `glow` key.
- `.card-demo` and `.alert` also consume `effects.backdropFilter` (harmless
  when `none`), so frosted surfaces render consistently with `.block`.

## 7. Specimen regeneration rules (M3)

- `moods/<id>/specimen.html` is **generated output**: never hand-edit it.
  Always run `ui-moods build-specimen <id>` and commit the regenerated file.
- Mood-specific DOM/CSS is out of v1 scope; the single matrix template is the
  only specimen structure.
- HTML comments inside the template must **not** contain the literal
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
