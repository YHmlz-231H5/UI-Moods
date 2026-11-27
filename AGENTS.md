# AGENTS.md — How AI agents should consume UI Moods

UI Moods is a **Style Specimen Registry**: a library of named UI styles
("moods"). Each mood is defined by design tokens (`tokens.json`), a
human-facing specimen page (`specimen.html`), a short semantic description
(`prompt.md`), and an acceptance checklist (`checklist.yaml`).

It also ships **app packs** (`apps/`): real mobile product interfaces for a
dozen industries, described as data and rendered against a mood's tokens.

And it ships a **component library** (`components/` + `themes/`): the common
parts — button, input, badge, card — as plain CSS classes, with the mood
chosen by which theme file is linked.

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

## When a task builds an interface

Prefer the component library over hand-written markup. It is the same visual
language in every mood, and it is the only path whose contrast is measured.

1. Link the component layer and one theme file:

   ```html
   <link rel="stylesheet" href="components/um-components.css">
   <link rel="stylesheet" href="themes/glass.css">
   ```

   If the page lets the user pick a mood, link every mood once and name it on
   the document instead — the switch then costs no network request:

   ```html
   <link rel="stylesheet" href="components/um-components.css">
   <link rel="stylesheet" href="themes/all.css">
   <script src="themes/switcher.js"></script>
   ```

   ```js
   UMTheme.set("night");
   ```

2. Use the `um-` classes. The variants are `--primary` `--default` `--text`
   `--success` `--warning` `--danger`, the sizes are `--sm` `--md` `--lg`,
   and the states are the real form states (`:checked`, `:disabled`,
   `:focus-visible`) — there is no JavaScript.

   ```html
   <button class="um-button um-button--primary">Save</button>
   <span class="um-badge um-badge--soft-success">Synced</span>
   ```

3. Do not restyle a component with your own values. If a class does not exist
   yet, build it from the contract in `tokens/roles.json` and add it there
   first — a new colour, radius or font size needs a role, not a literal.

4. If you are **adding a component**, the manifest is where it starts:
   `components/<id>/manifest.json` declares its variants, sizes, states,
   parts, props and accessibility, and `components/<id>/style.css` holds its
   styles. The stylesheet, the documentation page, the type declarations and
   the catalogue are all generated from those two files
   (`ui-moods build-components`, `ui-moods build-docs`, `ui-moods build-types`).
   Never hand-edit `components/um-components.css` or anything under `site/`.

5. If you are **changing a theme file**, change `moods/<id>/tokens.json` and
   regenerate. `themes/<id>.css` is generated, and its scope selectors are
   load-bearing: `:root[data-um-theme="<id>"]` has to stay one step more
   specific than `:root`, or several moods on one page will fight over
   `:root` and the mood in force will depend on the order the files were
   linked in.

6. If you are **adding a Vue component**, the wrapper lives in
   `vue/components/<id>.js` and follows `docs/vue-components.md`: the name is
   `UM<PascalCase>`, the props are the manifest's props, and the classes it
   paints are the classes the stylesheet declares. `node tools/check-vue.mjs`
   checks that, and `vue/components/index.js` is generated — never edit it by
   hand.

7. If you are **painting a shape whose colour carries the meaning on its
   own** — a timeline node, a rating star — use the `graphic` form of the
   status colour (`--um-color-warning-graphic`), not the fill form. The fill
   form clears 4.5:1 as a background for text and clears nothing as a picture:
   measured across the 32 moods, the raw warning colour sits at 1.39:1 on a
   container. The `graphic` roles are contracted to 3:1 and hold in every mood.

8. If you are **painting a surface**, paint it once. A frame that owns a
   surface paints it and the thing inside the frame paints nothing: two
   translucent layers are a colour no role names, and a guarantee made against
   one of them is a guarantee about a surface nobody sees. And a line colour
   never sits under a translucent cell — a cell with a line under it paints
   the flattened surface (`surface-panel`) instead.

9. If you change the **component layer or the role contract**, measure the
   result, do not eyeball it. `node tools/audit-contrast.mjs` prints every
   contract pair across the 32 moods and exits 1 when one falls short. The
   rendered pages are measured by `node tools/audit-render.mjs`, which drives
   `tools/probe/contrast.html` in a headless browser, walks every component's
   examples once per mood and reports what the browser actually painted. The
   current run is **51 008 measurements with zero failures**, and a change that
   moves it is a change to the library's promise. The same command with the
   word `geometry` measures the *layout* instead — whether the boxes the
   browser laid out are the boxes the markup asked for — and the word `apps`
   measures the app packs (those numbers are the moods' own contrast debt,
   not the component layer's, and they are tracked in `docs/known-gaps.md`).

10. If you paint a **disabled** control, say so in the markup, not only in the
    stylesheet. A `<button disabled>` and an `aria-disabled="true"` are states
    a reader can be told about and an audit can measure; a class that paints a
    dimmed element is only a picture. The rendered audit holds a disabled
    control to 2:1 (the `text-disabled` contract) and everything else to
    4.5:1, so a component that dims its days with a class alone is reported as
    a failure — correctly, because it has not declared a disabled state. When a
    real element cannot carry the state, use `aria-disabled="true"`, the way
    `um-link` does.

11. If a component **fills the width it is given**, it needs the library's box
    model, which the build emits for every component the library paints:
    `box-sizing: border-box` on the component and everything inside it. A
    host's own layout is deliberately left alone — the library states its box
    model for itself and for nothing else. Without it an input at
    `width: 100%` is wider than the column it sits in by its own padding, and
    the documentation site hides the problem because the site resets the box
    model for itself.

12. If a word sits on a **brand tint**, it takes `--um-color-*-on-soft`, not
    `--um-color-*-text`. The brand colour as text is contracted to 4.5:1
    against the page, an overlay and a container; on `color-*-soft-8` it is
    contracted to 3:1, because there it is an outline rather than a word.
    `badge`, `menu`, `segmented`, `tag` and `transfer` all use the `on-soft`
    form, and so must anything else that paints a word on a tint.

13. If a component **moves**, the reader decides whether it does. The library
    states its own motion contract: when the reader has asked the system for
    reduced motion, the durations drop to a hundredth of a millisecond — short
    enough that nothing visibly moves, long enough that `transitionend` still
    fires. The rule is generated from the manifests (`tools/lib/motion.mjs`),
    so it covers every component without anyone remembering to add it. The
    rendered audit measures both states: `node tools/audit-render.mjs motion`
    is the baseline (371 elements move) and
    `node tools/audit-render.mjs motion --reduced-motion` is the contract
    (none of them do).

14. If you change **the distribution**, keep the two copies of the stylesheet
    in step. `components/um-components.css` is the whole sheet; `css/` is the
    same sheet cut into pieces — `base.css` once, then one file per component.
    They are cut from one chunk list (`tools/lib/component-chunks.mjs`), so
    they cannot drift, and `node tools/check-package.mjs` proves it: it
    resolves every public name in `package.json` through Node's own resolver,
    imports the Vue package through those names and renders it, and compares
    the split stylesheet with the whole one. The rendered package probe
    (`node tools/audit-render.mjs package`) then measures the split stylesheet
    the same way the whole one is measured, so a host that links one file per
    component is held to the same number.

`site/index.html` is the documentation: an overview plus one page per
component, with the examples, the API tables and the class list, and a live
switcher over all 32 themes.

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
  **only** from the mood's tokens — including the `components` semantic
  layer, which every mood now ships. To change the style, change the tokens;
  never hard-code new magic values.
- In the **component layer**, the same rule holds with a different prefix:
  every colour, radius and font size comes from `var(--um-*)`. The component
  CSS is forbidden from holding a colour literal, a raw `border-radius` or a
  raw `font-size`, and `validate` fails the build if it does. A brand colour
  used as text takes `color-*-text`, never `color-*` — the raw one is a fill
  colour and it is not guaranteed to read as text.
- A muted role (`text-secondary`, `text-placeholder`, `text-disabled`) is
  already derived to be readable. Do not re-derive it, and do not replace it
  with the mood's raw `colors.muted`, which sits below 4.5:1 as text in 20 of
  the 32 moods.
- Paint a status chip from the state layer, never from a derived tint: use
  `components.badge.<state>` / `components.alert.<state>` (or the
  `--mood-components-*` variables, or the `.badge.<state>` / `.notice.<state>`
  classes). Self-made alpha variants (e.g. `rgba(accent, 0.28)`) are not
  tokens, and a state colour on a panel is unreadable in most moods — the
  layer's own foreground is measured to reach 4.5:1 against its fill.
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
