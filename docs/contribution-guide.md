# Contributing a new mood

Every mood lives in `moods/<id>/` and must pass `ui-moods validate` before it
is merged and registered in `moods.json`.

## Steps

1. **Scaffold** — `npx ui-moods scaffold mood <id> --name "Name" --name-zh "名称"`.
   This writes `tokens.json`, `prompt.md` and `checklist.yaml` from the
   template. Add `--from <existing-id>` to start from another mood's palette.
   (You can also copy `templates/mood/` by hand.)
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
  `templates/mood/sections/*.html`, then regenerate every mood.
- Section partials prefix their classes with `s-` so they cannot collide
  with the shell or with another partial.
- A partial may carry its own `<style>` block (scoped to its `s-` classes) and
  should wrap its markup in one root element. Partial order is filename order,
  so name them `NN-topic.html`.
- HTML comments must not contain the literal `<style id="mood-tokens">`
  opening tag (it breaks `build-specimen`).
- The shell must contain the sections marker **exactly once**, inside `<body>`.
  `build-specimen` injects at the *last* occurrence, so a stray copy in the
  shell's leading comment or footer would capture every section. Likewise, do
  not write the marker inside a section partial.
- A section partial can ask for a **generated picture** with
  `{{art:seed}}` (or `{{art:seed:variant}}` to pin the composition family).
  `build-specimen` replaces it with inline SVG drawn from the mood's tokens —
  the library ships no image assets. Use it wherever a real product screen
  would show a thumbnail.
- The generated SVG is drawn with `preserveAspectRatio="slice"`, so its canvas
  ratio should match the container it lands in — otherwise the picture gets
  cropped. `{{art:seed:520x160}}` (or `{{art:seed:variant:520x160}}`) sets
  the canvas size; the default is 240×160.
- `validate` rejects a generated file that still contains an unreplaced
  `{{placeholder}}`, or that has block-level content inside `<head>` — both
  are signs the shell and the build script drifted apart.
- Optional token usages in the template need CSS fallbacks
  (`var(--mood-effects-glow, none)`), see `docs/css-var-mapping.md` §8.
- New hardcoded layout literals must be added to the allowlist in
  `schemas/allowlist.json` (documented in `docs/css-var-mapping.md` §5)
  before `validate` will pass.
- Fractional lengths are fine **in tokens** (`borders.width`, shadows), but
  never as raw literals in specimen body CSS — token values travel through
  `var(--mood-*)` into the exempt `style#mood-tokens` block.
- Radii must resolve to `var(--mood-radii-*)`. A raw `border-radius: 12px` in
  the specimen is a validation error even when `12px` is a legal layout
  metric — radii are theme parameters, not layout mechanics.
- Keep tokens the source of truth: colors, radii, shadows, spacing-scale,
  fonts, effects and motion never get hardcoded in the specimen.

## Checklist semantics

See `docs/schema-checklist.md` — only `colors` and `components` scopes drive a
dedicated scan in v1; other scopes are reserved and warn when used.

---

# Contributing a new app pack

An app pack describes a set of mobile screens for one industry, as data.

## Steps

1. **Scaffold** — `npx ui-moods scaffold app <id> --name "Name" --name-zh "名称" --mood glass`.
2. **app.json** — edit the screen definitions:
   - `mood` — which mood's tokens the screens inherit. **Required.**
   - `chrome` — app-wide `statusbar` and `tabbar`. Every screen inherits them.
   - `screens[]` — each screen has an `id`, a `title`, an optional
     `chrome.navbar` override, and a `blocks` array.
3. **Render** — `npx ui-moods build-apps <id>`.
4. **Validate** — `npx ui-moods validate --app <id>` must print PASS.
5. **Register** — add the app to `apps.json`, then run the full
   `npx ui-moods validate`.

## Rules

- `apps/<id>/screens/*.html` is generated output. Never hand-edit it — edit
  `app.json` and re-render.
- Block types and their exact props are defined in `tools/lib/blocks.mjs`.
  Only those names are valid; an unknown type fails the renderer.
- Icon names come from `tools/lib/icons.mjs`. Only those names are valid.
- Blocks describe **content**, not markup. A block never carries a color,
  radius, shadow or font of its own — the renderer only emits
  `var(--mood-*)` references.
- Semantic tones are names, not colors: `ok` / `warn` / `danger` / `accent` /
  `up` / `down`. The stylesheet maps them onto the mood's palette.
- `app.json` is the authoritative form for agents. The rendered HTML is for
  humans and for the gallery.
- Shared screen styling lives in `templates/app/app.css`. If you add a
  visual pattern that needs new CSS, add it there — not inline in a block.

## Giving a screen a picture

The library ships no image assets, so every "photo" is drawn by code from the
mood's tokens (`tools/lib/artwork.mjs`). A screen asks for one by prop, not by
file path:

| Where | Prop | Notes |
| --- | --- | --- |
| `card` | `media: true` + `artSeed` | 360×132 media band; `artVariant` pins the composition |
| `mediaGrid` / `carousel` | `art` on each item | 168×96 / 264×132 |
| `list` | `art` on the item | 44×44 leading thumbnail (mutually exclusive with `icon`/`avatar`) |
| `banner` | `art` | 360×220 cover behind the banner copy |
| `artwork` block | `seed` + `height` + `variant` | a standalone band; `height` must be one of 120/144/160/180/200/240 |

The seed decides the picture, so the same screen always renders the same one.
Omitting the seed lets the renderer pick one from the screen's own context —
good enough for a reference screen, but name the seed whenever the picture
means something ("recipe-cover", not "img1").
