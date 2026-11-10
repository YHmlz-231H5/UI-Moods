# AGENTS.md — How AI agents should consume UI Moods

UI Moods is a **Style Specimen Registry**: a library of named UI styles
("moods"). Each mood is defined by design tokens (`tokens.json`), a
human-facing specimen page (`specimen.html`), a short semantic description
(`prompt.md`), and an acceptance checklist (`checklist.yaml`).

It also ships **app packs** (`apps/`): real mobile product interfaces for a
dozen industries, described as data and rendered against a mood's tokens.

## When a task references a mood

A task may contain `style: mood/<id>@<version>` (for example
`style: mood/glass@1.0.0`). Resolve it as follows:

1. **Parse** the reference: `mood/<id>@<version>` maps to the filesystem path
   `moods/<id>/`.
2. **Load** that mood's `prompt.md`, `tokens.json` and `checklist.yaml` — or
   the equivalent single-file prompt package produced by
   `ui-moods bundle <id>`.
3. **Visual channel (optional)**: if you support vision, you may also read a
   relevant fragment of `specimen.html`. The library ships **no image assets** —
   every picture in it is inline SVG generated from the tokens — so there is no
   `preview.png` to read.

## When a task references an app pack

A task may contain `style: app/<id>@<version>`. Resolve it as:

1. **Parse** the reference: `app/<id>@<version>` maps to `apps/<id>/`.
2. **Load** `apps/<id>/app.json` — the screen definitions — and the mood it
   references (`app.json` → `mood`).
3. **Load that mood's** `tokens.json` and `checklist.yaml` as well: the app
   pack carries no visual parameters of its own.

## Rules

- When a task references `mood/<id>@<version>`, load that mood's prompt +
  tokens + checklist (or its bundle) **before writing any code**.
- When a task references `app/<id>@<version>`, load the app's `app.json`
  **and** its mood's tokens + checklist **before writing any code**.
- Do **not** read the full `specimen.html` by default. It is a human-facing
  artifact; read relevant fragments only when the user asks, or when you need
  to verify page structure. The same applies to `apps/<id>/screens/*.html` —
  read `app.json` instead; it is the compact, authoritative form.
- Colors, radii, shadows, spacing, borders, effects and fonts may come
  **only** from the mood's tokens — including the optional `components`
  semantic layer. To change the style, change the tokens; never hard-code new
  magic values.
- Prefer solid `colors.accent/ok/warn/danger` fills over self-made alpha
  variants (e.g. `rgba(accent, 0.28)`). Derived tints are not tokens; the
  component state-color layer arrives in v1.1.
- Radii must resolve to `var(--mood-radii-*)`. A raw `border-radius: 12px` in
  a mood's own UI is a token violation even when `12px` happens to be a legal
  layout metric.
- Theme parameters must not leak outside their scope. Page structure may be
  extended (icons, empty states, charts, etc.), but visual parameters must
  stay within the tokens, or values explicitly justified in the task prompt.
- After implementing, self-check against the mood's `checklist.yaml`. If
  `ui-moods validate` is available, run it. For subjective items, state your
  trade-off in one sentence.
- If context is tight, use the single-file prompt package produced by
  `ui-moods bundle <id>`.

## Reference syntax

Only one syntax is supported in v1:

```
style: mood/<id>@<version>
style: app/<id>@<version>
```

`<version>` is semver. Omitting the patch (e.g. `mood/glass@1.0`) is allowed
when only `1.0.0` has been published. Do not use `glass@1` or `@v1` — they
are not valid references.
