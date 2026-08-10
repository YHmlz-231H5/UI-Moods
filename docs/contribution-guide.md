# Contributing a new mood

Every mood lives in `moods/<id>/` and must pass `ui-moods validate` before it
is merged and registered in `moods.json`.

## Steps

1. **Scaffold** — copy `templates/mood/` to `moods/<your-id>/`.
2. **tokens.json** — fill every required field (`id`, `version`, `meta`,
   `colors`, `typography`, `radii`, `borders`, `effects`, `shadows`,
   `spacing`, `motion`). Schema: `schemas/tokens.schema.json`.
   - `id` must match `^[a-z0-9]+(-[a-z0-9]+)*$`; `version` is semver.
   - Add `colors.onAccent` when your accent/status fills are solid dark or
     solid light (text/icon color on those fills); it is a recommended
     extension, not required.
   - Add `components` when you want a semantic layer agents can read.
     Leaves must be `{group.key}` references or allowlisted keywords
     (`transparent | none | currentColor | inherit | 0`).
3. **prompt.md** — one paragraph (≤ 200 words, English first), keywords, when
   to use / when to avoid.
4. **checklist.yaml** — include at least: one `value` assertion on a token
   path, a `token-only` item for `colors`, a `token-only` item for
   `components` (if you ship components), a `contrast` item on an opaque
   pair, and one `subjective` item for the feel.
5. **Generate** — `npx ui-moods build-specimen <id>` (never hand-edit
   `specimen.html`; the template's `style#mood-tokens` block is the only
   injection point).
6. **Validate** — `npx ui-moods validate --mood <id>` must print PASS.
7. **Register** — add the mood to `moods.json`, then run
   `npx ui-moods validate` for the whole registry.

## Rules

- `specimen.html` is generated output. Changes to the matrix go into
  `templates/mood/specimen.html`, then regenerate every mood.
- HTML comments must not contain the literal `<style id="mood-tokens">`
  opening tag (it breaks `build-specimen`).
- Optional token usages in the template need CSS fallbacks
  (`var(--mood-effects-glow, none)`), see `docs/css-var-mapping.md` §8.
- New hardcoded layout literals must be added to the allowlist in
  `docs/css-var-mapping.md` §5 before `validate` will pass.
- Fractional lengths are fine **in tokens** (`borders.width`, shadows), but
  never as raw literals in specimen body CSS — token values travel through
  `var(--mood-*)` into the exempt `style#mood-tokens` block.
- Keep tokens the source of truth: colors, radii, shadows, spacing-scale,
  fonts, effects and motion never get hardcoded in the specimen.

## Checklist semantics

See `docs/schema-checklist.md` — only `colors` and `components` scopes drive a
dedicated scan in v1; other scopes are reserved and warn when used.
