# UI Moods

**Style Specimen Registry & App Reference Library** — a library of named UI
styles ("moods") plus a protocol that lets AI agents consume them faithfully.
You pick a mood, bundle it into a self-contained prompt package, and hand it
to any coding agent together with your functional requirements. The agent
implements against the mood's design tokens and self-checks against its
acceptance checklist.

On top of the style registry there is a second layer: **industry app packs** —
real mobile product interfaces (fintech, health, commerce, delivery, travel,
education, social, fitness, music, workspace, logistics, real estate,
automotive, pet care) rendered from the same design tokens, so an agent can
copy a *layout and flow* as well as a *style*.

> The component layer is plain HTML and CSS classes — no build step, no
> runtime. A **Vue 3 package** sits on top of it (`ui-moods/vue`), generated
> from the same manifests, so a Vue project gets `UMButton` without giving up
> the plain-CSS path. Not a UI generator. No cloud service. Just files,
> tokens, and a clear contract for agents and for people.

## Why

Describing visual style in text is lossy: "frosted glass", "forest" and
"apple-style" mean different things to different models. UI Moods makes style
**referable**: `mood/glass@1.0.0` points to a concrete specimen, exact design
tokens, and a machine-readable acceptance checklist.

The same lossiness applies to *layout*: "a checkout screen" could be a bottom
sheet, a full page, or a drawer. App packs make that referable too —
`app/commerce@1.0.0` points to rendered screens whose structure is concrete.

## Quick start

```bash
# Clone first (GitHub distribution)
git clone <your-fork-or-repo-url> ui-moods
cd ui-moods
npm install

# Browse the library (moods + apps, searchable)
npx ui-moods serve

# Validate the registry
npx ui-moods validate

# Package one mood into a single prompt file
npx ui-moods bundle glass > glass.prompt.md
```

Using the **component library** in your own project is a different door:

```html
<link rel="stylesheet" href="css/base.css">
<link rel="stylesheet" href="css/button.css">
<link rel="stylesheet" href="themes/glass.css">
```

```html
<button class="um-button um-button--primary">Save</button>
```

See [Using it in your own project](#using-it-in-your-own-project).

> Distribution model (v1): **GitHub-first, npm-ready**. `npx ui-moods …` works
> after `npm install` inside the cloned repository. The component library is
> also packaged for the registry — `css/`, `themes/`, `vue/` and `types/` are
> published, with an `exports` map for every public name — but the publish
> itself is not done yet. Release steps: `docs/release.md`.

> Windows PowerShell users: use `npx ui-moods bundle glass | Out-File -Encoding utf8 glass.prompt.md`
> so the prompt file is written as UTF-8.

## The two layers

| | Style specimen (`moods/`) | App pack (`apps/`) |
| --- | --- | --- |
| What it fixes | How it **looks** | How it **flows** |
| Unit | one mood = one style | one app = one industry |
| Files | `tokens.json` · `specimen.html` · `prompt.md` · `checklist.yaml` | `app.json` (screen data) · `screens/*.html` (generated) |
| Reference | `mood/<id>@<version>` | `app/<id>@<version>` |
| Reusability | any layout, in this style | a full product surface, in one style |

Both layers share one rule: **visual parameters come only from the mood's
tokens.** An app pack picks a mood (`app.json → "mood"`) and every screen it
renders inherits that mood's entire visual language.

The **component layer** (`components/` + `themes/`) sits underneath both: it
supplies the parts — button, input, badge, card — as plain CSS classes, and a
theme file decides what they look like. See
[The component library](#the-component-library).

## Status states, already solved

A status chip is the easiest thing to get wrong: the natural move is to write
`rgba(accent, 0.15)` over an accent fill, and then discover the label is
unreadable in a third of the moods.

Every mood therefore ships a **state layer**. `components.badge` and
`components.alert` each declare five states — `neutral`, `accent`, `ok`,
`warn`, `danger` — and each one names the fill, the foreground, the border and
the radius it is painted with. The layer is emitted as CSS variables, so an
agent paints a chip by writing a class, not by inventing an alpha:

```html
<span class="badge warn">Review</span>
<div class="notice danger"><span class="n-mark">Stop</span>…</div>
```

```css
.badge.warn {
  background: var(--mood-components-badge-warn-bg);
  border-color: var(--mood-components-badge-warn-border);
  color: var(--mood-components-badge-warn-fg);
}
```

The foreground is not a guess. `tools/lib/state-colors.mjs` derives one per
state from the mood's own palette and measures it: across the 32 moods, all
128 state pairs reach **at least 4.5:1**, and the derivation aims at 4.6:1 so
they keep a margin. `validate` enforces the same bar, so a mood that breaks the
rule cannot be published.

The full mapping is documented in [`docs/css-var-mapping.md`](docs/css-var-mapping.md)
§3.1.

## The component library

A mood tells you how a style **looks**. It does not tell you how a button is
**built**. That gap is what `components/` closes: one implementation of the
common components, written once, that any mood can wear.

```html
<link rel="stylesheet" href="components/um-components.css">
<link rel="stylesheet" href="themes/glass.css">
```

```html
<button class="um-button um-button--primary">Save</button>
<span class="um-badge um-badge--soft-success">Synced</span>
```

Two links and one class. Which theme file is linked decides everything else —
swap `themes/glass.css` for `themes/ios.css` and the same markup becomes an
iOS control, with no other change.

### Switching a mood at runtime

Link every mood once, and the mood becomes an attribute on the document:

```html
<link rel="stylesheet" href="components/um-components.css">
<link rel="stylesheet" href="themes/all.css">
```

```js
document.documentElement.setAttribute('data-um-theme', 'night');
```

`themes/all.css` carries all 32 moods — 116 KB, one request, gzipping to a
fraction of that. Each mood claims its own scope at a specificity one step
above `:root`, so the mood that matches the attribute wins the cascade
whatever order the files were linked in. **Switching costs no network
request at all.** Measured over 96 switches: a median of 1.4 ms and a
maximum of 3.4 ms, which is inside a single frame — the style is already
correct before the browser has a chance to paint.

`themes/switcher.js` is the same thing with the remembering attached, and it
is the only JavaScript the project ships:

```html
<script src="themes/switcher.js"></script>
```

```js
UMTheme.set('night');     // apply a mood
UMTheme.get();            // the mood in force
UMTheme.cycle();          // the next one
UMTheme.list();           // the catalogue
```

It reads `?theme=` from the URL first (a link with `?theme=glass` shows
glass, whatever the last visit chose), remembers the choice in
`localStorage`, and follows another tab that changes it. It is
framework-agnostic on purpose: a Vue app, a React app and a plain HTML page
all call the same three lines.

### It reads from the right as well

`dir="rtl"` is a one-attribute change, and the library follows it. The sides of
a box are written logically — `border-inline-start`, `inset-inline-start`,
`margin-inline-start`, `text-align: start` — so the line that leads the panel
leads it in either direction. The shapes that point along the reading
direction — a chevron, an arrow, a check mark — turn with it, through one
number the library keeps for exactly this:

```css
:root { --um-mirror: 1; }
[dir="rtl"] { --um-mirror: -1; }
```

```html
<html dir="rtl">
```

Nothing else changes: no second stylesheet, no theme variant, no request. The
chevrons of the tree, the collapse, the cascader and the select follow
Element Plus's convention — 45° closed (▶), 135° open (▼).

A modifier class that *names* a side keeps it: `.um-drawer--left` is a drawer
on the left, in either direction, because the name is the contract.

The library is checked in both directions by a probe that renders every
example twice and holds the two readings against each other: **3 713 boxes
read in two directions, zero failures**.

### The CSS is the product; Vue is a thin layer on top

Element Plus and Arco Design both ship framework components. This library is
built the other way round: the **CSS layer is the product**, and the manifest
is the source both layers are generated from. A `.um-button` is exactly
"an agent copies a class" — and the same split Element Plus uses, where
`theme-chalk` is plain CSS and the Vue components sit on top of it.

The Vue package therefore adds nothing of its own. Every wrapper renders the
same markup the documentation shows, exposes the props the manifest declares,
and lets the stylesheet decide what it looks like — so a page wearing a
mood looks the same whether it was written in HTML or in Vue.

```js
import { createApp } from "vue";
import UM from "ui-moods/vue";
import "ui-moods/components/um-components.css";
import "ui-moods/themes/all.css";

createApp(App).use(UM).mount("#app");
```

```html
<UMButton variant="primary" size="lg">Save</UMButton>
```

Every component is registered twice — `UMButton` and `um-button` — so a
template can use whichever reads better. The wrappers need no build step:
they are plain ES modules with render functions. See
[`docs/vue-components.md`](docs/vue-components.md) for the contract, and
`node tools/check-vue.mjs` for the check that keeps a wrapper honest.

Every value-bearing component answers to `v-model` as well as to its own prop:

```vue
<UMSwitch v-model="notify" />
<UMInput v-model="name" />
<UMRadioGroup v-model="plan">
  <UMRadio value="free">Free</UMRadio>
  <UMRadio value="pro">Pro</UMRadio>
</UMRadioGroup>
```

The binding is **additive**: a component keeps the prop it had — `checked` on
a switch, `value` on an input — and the binding wins when it is there. A
radio group owns the selection and its options follow it, through Vue's own
`provide`/`inject`.

### Using it in your own project

Three ways, from the simplest to the smallest.

**Plain HTML — two links and a class.**

```html
<link rel="stylesheet" href="css/base.css">
<link rel="stylesheet" href="css/button.css">
<link rel="stylesheet" href="themes/glass.css">
```

`css/base.css` is linked once. It holds the layer constants, the one focus
treatment, the one disabled treatment and the box model. Then one file per
component you actually use — the same shape Element Plus ships
(`theme-chalk/base.css` plus `theme-chalk/el-button.css`).

**Vue 3 — the plugin, or the components one at a time.**

```js
import { createApp } from "vue";
import UM from "ui-moods/vue";
import "ui-moods/css/all.css";
import "ui-moods/themes/all.css";

createApp(App).use(UM).mount("#app");
```

Or, without the plugin, one component at a time:

```js
import { UMButton } from "ui-moods/vue/button";   // one component
import { UMButton, UMTag } from "ui-moods/vue";   // the whole library
```

**A mood that changes at runtime.**

```js
import { useTheme } from "ui-moods/vue";

const { theme, setTheme, themes } = useTheme();
```

Or, without Vue — the switcher is the only JavaScript the project ships:

```html
<script src="themes/switcher.js"></script>
<script>UMTheme.set("night")</script>
```

**What lands in your bundle.** `css/all.css` is the whole library, 288 KB
uncompressed. If that is more than you use, link `css/base.css` and one file
per component instead. Both are published, and
`node tools/check-package.mjs` proves that every public name in
`package.json` resolves to a file that exists, that the Vue package imports
through those same names and renders, and that the split stylesheet is
byte-for-byte the stylesheet the whole sheet is cut from.

### The contract

`tokens/roles.json` is the single source of the variable vocabulary. It
declares **95 roles** (`--um-*`) and **68 contrast guarantees**, and every
theme file is generated from it.

The rules the component layer obeys, and `validate` enforces:

- **No literals.** The component CSS contains no colour, no raw
  `border-radius`, no raw `font-size`. Everything is `var(--um-*)`.
- **No JavaScript.** The switch and the checkbox are real form elements; the
  state is `:checked` and `:disabled`.
- **Every theme defines every role.** A missing role is invisible in a
  screenshot of one theme and breaks the component in every other one.
- **Every guarantee holds in every theme.** 68 pairs × 32 themes = **2 176
  measurements**, all green.
- **The rendered pages hold too.** A probe loads every component's live
  examples, walks the whole document once per mood and measures what the
  browser actually painted: **51 328 measurements, zero failures**. A second
  probe measures the *geometry* — whether the boxes the browser laid out are
  the boxes the markup asked for — a third measures the app packs, and a
  fourth measures the *published* package: the same 51 328 measurements against
  the split stylesheet, so a host that links one file per component is measured
  the same way as one that links the whole sheet.
- **Motion is a reader's choice.** 371 of the library's elements move when the
  reader does something. When the reader has asked the system for reduced
  motion, **none of them do**: the durations drop to a hundredth of a
  millisecond, which is short enough that nothing visibly moves and long
  enough that `transitionend` still fires. The probe measures both states in a
  browser, with the preference emulated where the media query reads it.
- **The boxes fit.** The library states its own box model for the elements it
  paints, so an input at `width: 100%` is as wide as its column and not a
  padding wider. A host's own layout is left alone.
- **A shape has its own bar.** Text is held to 4.5:1; a shape whose colour
  carries the meaning on its own is held to 3:1, and the `graphic` form of
  each status colour exists for it. The raw warning colour sits at 1.39:1 on
  a container — a timeline node nobody can see.
- **The library reads in both directions.** A side is written logically, so
  `dir="rtl"` moves it without a second stylesheet, and a shape that points
  along the reading direction turns with it. 3 713 boxes are read in two
  directions and not one of them fails to follow.

### How a colour is derived

The moods are 32 different design languages, so no fixed blend works for all
of them: a pastel brand colour has to travel a long way before it reads on its
own tint, and a near-black one overshoots immediately. The library therefore
**derives the blend from the contrast requirement** rather than guessing it.

Two naming choices matter:

- **`soft-N` instead of `light-N`.** Element Plus writes `light-3` as
  `mix(white, primary, 30%)`, which only holds for a light theme — on a dark
  mood a hover state would end up lighter than the page it sits on. Here
  `soft-N` is `mix(base, bg-page, N/10)`, so it always recedes *toward the
  page*, on a light theme and on a dark one.
- **`strong` instead of `dark-N`.** `strong` is `mix(base, text-primary, 0.2)`
  — it moves toward the text, so it deepens on a light theme and brightens on
  a dark one.

One formula, 32 moods.

Where a fixed blend cannot work, the library derives the foreground instead:
`color-primary-text` is the brand colour moved just far enough toward the text
colour to reach 4.5:1 **on the page, on a floating overlay and inside a
container at once**. The brutal mood is the reason: a bright yellow is
readable as a fill and unreadable as text.

### The library is stricter than the moods

A mood's `colors.muted` is chosen for looks, and in 20 of the 32 moods it sits
below 4.5:1 as text. The library does not change the mood. It derives
`text-secondary` from it — moved toward the text colour just far enough to
read — and every muted role in the component layer uses that instead.

The same holds for the disabled state. A disabled label is faded toward the
surface it sits on, but only as far as 2:1 allows, and the surface it fades
toward is the **flattened** one: a translucent fill over a translucent
container is a colour that neither token names on its own. Measured against
the fill alone, a disabled label in the frosted themes sits at 1.56:1 —
invisible. Measured against the real surface, it reads.

### Where it is

- `components/<id>/manifest.json` — **the contract.** One file per component:
  its variants, sizes, states, parts, props, accessibility and its live
  examples.
- `components/<id>/style.css` — that component's styles.
- `components/um-components.css` — the assembled stylesheet (generated).
- `css/` — **the same stylesheet, cut into pieces** (generated): `base.css`
  once, then one file per component, plus `all.css` for a host that wants one
  file.
- `site/` — the **documentation site** (generated): an overview plus one page
  per component, with the examples, the API tables and the class list.
- `types/index.d.ts` — the type declarations (generated).
- `vue/components/<id>.js` — the **Vue 3 wrappers**, one per component.
- `vue/components/index.js` — the barrel and the plugin (generated).
- `themes/<id>.css` — 32 generated theme files, variables only.
- `themes/all.css` — all 32 moods in one sheet, switched by attribute.
- `themes/switcher.js` — the runtime switcher (optional, framework-agnostic).
- `tokens/roles.json` — the role contract.

### One file in, four things out

The manifest is the only hand-written description of a component. Everything
else is generated from it:

```
components/<id>/manifest.json
   ├── →  components/um-components.css   (the styles)
   ├── →  css/base.css + css/<id>.css    (the same styles, cut into pieces)
   ├── →  site/component/<id>.html        (the documentation page)
   ├── →  types/index.d.ts                (the type declarations)
   ├── →  vue/components/index.js         (the Vue barrel and plugin)
   └── →  components/index.json           (the catalogue)
```

That is the difference between a component library and a folder of CSS. A
hand-written documentation page is a second copy of the component, and the two
copies drift; here they cannot, because there is only one copy.

It also means the manifest is **framework-neutral**: a CSS generator reads the
class names, and a component generator reads the variant and prop names. The
same file describes the plain-HTML library and the Vue 3 wrapper — the way
Element Plus ships `theme-chalk` separately from its Vue components, and Arco
ships `theme.css` separately from its React ones.

`validate` enforces the agreement: a manifest that advertises a variant the
stylesheet never paints is an error, and a stylesheet that is out of date with
its partials is an error too. `node tools/check-vue.mjs` enforces the same
agreement for the wrappers: it mounts every wrapper with
`@vue/server-renderer` and compares the rendered markup with the manifest —
the props, the classes, the parts.

### Where it is going

`docs/component-parity.md` holds the full checklist against Element Plus: 7
categories, 82 components, and what this repository covers today. All 82 are
covered, and the two places where the answer is not "the same as EP's" are
written down rather than glossed over.

### What is in the library now

**83 component manifests, covering all 82 of Element Plus's components** — one
manifest can cover more than one native control, and two of them are forms EP
does not list separately:

| Manifest | Covers | Element Plus |
| --- | --- | --- |
| `input` | `um-input`, `um-textarea`, `um-select` | Input, Select |
| `field` | `um-field`, `um-field__label`, `um-field__message` | Form, Form Item |
| the other 81 | one each | one each |

- **Basic** — border, color, container, icon, layout, link, scrollbar, space,
  splitter, typography, text, config-provider
- **Form** — button, input, field, checkbox, checkbox-group, radio, radio-group,
  switch, slider, rate, input-number, upload, date-picker, date-time-picker,
  time-picker, time-select, autocomplete, color-picker, color-picker-panel,
  date-picker-panel, mention, input-tag, input-otp, tree-select
- **Data** — avatar, badge, calendar, card, carousel, collapse, descriptions,
  empty, image, infinite-scroll, pagination, progress, result, skeleton,
  statistic, table, virtual-table, tag, timeline, tour, tree, virtual-tree,
  segmented, transfer, cascader
- **Navigation** — affix, anchor, backtop, breadcrumb, dropdown, menu,
  page-header, steps, tabs, pagination
- **Feedback** — alert, dialog, drawer, loading, message, message-box,
  notification, popconfirm, popover, tooltip

[`docs/component-parity.md`](./docs/component-parity.md) lists all 82 against
what is here.

Each of them has a Vue 3 wrapper, so the library is usable from plain HTML and
from a Vue project with the same markup underneath.

## Using with an AI agent

The shortest path, in four steps:

1. Pick a mood — browse the library or `moods/` (e.g. `glass`).
2. `npx ui-moods bundle glass > glass.prompt.md`
3. Send `glass.prompt.md` + your functional requirements to the agent.
4. The agent implements from the tokens and self-checks the checklist.

### Three ways to integrate

| Way | What you do | Best for |
| --- | --- | --- |
| **A · Bundle** | `npx ui-moods bundle glass` → paste the prompt package into Cursor / Claude / Codex | One-off use; fastest |
| **B · Repo reference** | clone / submodule / npm-depend on this repo; write `style: mood/glass@1.0.0` in your prompt; make sure the agent can read `AGENTS.md` and `moods/glass/` | Long-lived projects; reproducible styles |
| **C · Tokens only** | copy `tokens.json` (optionally with `prompt.md`) | You only want the palette/radii, not the full character |

### Ordering template

```
Use mood/glass@1.0.0 from ui-moods for the visual style.
Build: <functional requirement, e.g. settings page with profile form>
Rules: colors/radii/spacing/effects only from that mood's tokens;
run through its checklist before delivery; cite the mood version in your summary.
```

If you are using the bundle, paste `glass.prompt.md` first, then the
requirement. Agents should follow [AGENTS.md](./AGENTS.md) when working inside
this repository.

Ready-to-copy examples live in [`examples/`](./examples) (bundle usage and
repository-reference usage).

## Repository layout

```
ui-moods/
├─ moods/<id>/        # specimen.html + tokens.json + prompt.md + checklist.yaml
├─ apps/<id>/         # app.json (screen data) + screens/*.html (generated)
├─ components/<id>/   # manifest.json + style.css  (one directory per component)
├─ css/               # the stylesheet cut into pieces: base.css + one per component
├─ themes/<id>.css    # 32 generated theme files (variables only)
├─ themes/all.css     # all 32 moods in one sheet, switched by attribute
├─ themes/switcher.js # the runtime switcher (optional, framework-agnostic)
├─ site/              # generated documentation site (one page per component)
├─ vue/               # the Vue 3 package: index.js · components/<id>.js · lib/
├─ type-tests/        # type-level assertions (the bindings, at compile time)
├─ types/             # generated type declarations
├─ tokens/            # roles.json — the component layer's role contract
├─ schemas/           # tokens.schema.json · checklist.schema.json · allowlist.json
├─ templates/
│  ├─ mood/           # specimen shell + sections/*.html partials
│  └─ app/            # app.css (shared screen stylesheet)
├─ tools/             # cli · build-specimen · build-apps · build-themes
│                     # · build-components · build-dist · build-docs · build-types
│                     # · build-vue · validate · check-vue · check-component
│                     # · check-package · check-v-model · audit-contrast
│                     # · audit-render · verify-themes · serve · scaffold
│                     # · probe/ (the measuring instruments:
│                     #   contrast · geometry · motion · package · validity
│                     #   · state · rtl · apps)
├─ docs/              # mapping convention · checklist semantics · parity checklist
│                     # · contribution guide · vue-components · known gaps
├─ AGENTS.md          # protocol for AI agents
├─ moods.json         # style registry index
└─ apps.json          # app registry index
```

### A mood is four files

- `specimen.html` — human-facing visual truth, generated from tokens
  (never hand-edit; run `ui-moods build-specimen <id>`). Assembled from
  `templates/mood/specimen.html` plus the 28 section partials in
  `templates/mood/sections/` (palette & type, logo & buttons, cards & table,
  navigation, hero, forms, data display, charts, stats, feedback, layouts,
  tabs, timeline, user, media, pricing, testimonials, FAQ, footer, ecommerce,
  dashboard, settings, onboarding, chat, content, calendar, kanban, component
  states).
  A section can ask for a picture with `{{art:seed}}` — it is drawn from the
  mood's tokens at build time.
- `tokens.json` — the single source of truth for colors, type, radii, borders,
  effects, shadows, spacing and motion.
- `prompt.md` — short semantic description (English first).
- `checklist.yaml` — machine-readable acceptance criteria.

### An app pack is two things

- `app.json` — the screen definitions: a list of screens, each an ordered
  list of **blocks** (48 block types: `list`, `statGrid`, `bars`, `form`,
  `order`, `timeline`, `chat`, `map`, …). Pure data, no HTML.
- `screens/*.html` — the rendered result (generated; run
  `ui-moods build-apps <id>`). Each screen is a self-contained HTML file with
  the mood's tokens inlined.
- `screens/index.html` — the pack's own cover page (generated): a cover
  artwork plus one card per screen, each with a code-drawn miniature phone.

### There are no image assets

The library ships no photographs. Every picture — a product shot, a dish, an
album cover, a gallery thumbnail — is **drawn by code** from the mood's own
tokens, by `tools/lib/artwork.mjs`. A seed picks a composition family
(`mesh`, `strata`, `orbit`, `waves`, `arch`, `rings`, `petal`, …) and a
deterministic layout, so the same screen always renders the same picture and
every mood gets its own set of covers.

App screens reach it through the `artwork` block and the `art` / `artSeed`
props on `card`, `mediaGrid`, `carousel`, `list` and `banner`. The gallery
draws a miniature UI scene for each mood card and a miniature phone for each
app card — live in the browser, not a stored image — and each app pack's
`index.html` repeats the miniature phone per screen.

## Validation guarantees

`ui-moods validate` checks, per mood:

- `tokens.json` / `checklist.yaml` conform to the schemas;
- `components` references resolve and leaves are token refs or allowlisted
  keywords;
- the **state layer** is complete: `components.badge` and `components.alert`
  each declare all five states (`neutral` `accent` `ok` `warn` `danger`), and
  every state's foreground reaches 4.5:1 against its fill;
- the generated specimen's CSS variables exactly match the tokens;
- no color literals or off-allowlist magic numbers outside the token block;
- **no raw `border-radius` literals** — radii must resolve to `var(--mood-radii-*)`;
- the generated file has **no unreplaced `{{placeholder}}`** and no block-level
  content inside `<head>` — so a build bug cannot ship a silently broken page;
- WCAG contrast assertions pass (translucent colors are composited first).

And per app pack:

- `app.json` parses, ids are unique, the referenced mood exists;
- every block type is known to the renderer;
- each rendered screen exists, carries the mood token block, contains no
  `<script>`, no color literals and no raw radius literals.

It also checks registry coherence: every directory on disk is registered in
`moods.json` / `apps.json`, and every registered id exists on disk.

And for the component library:

- the component CSS reads only variables the contract declares, and declares
  every layer constant it needs;
- the component CSS contains **no colour literal**, **no raw `border-radius`**
  and **no raw `font-size`**;
- every `px` in the component layer is on the allowlist in
  `schemas/component-allowlist.json`, with a stated reason;
- **every theme defines every role** in the contract, and defines nothing
  that is not in it;
- every contrast guarantee in the contract holds in every theme — 68 pairs ×
  32 themes = 2 176 measurements;
- every Vue wrapper agrees with the manifest it was written from — the props
  are the manifest's props, and every class it paints is a class the
  stylesheet declares;
- **no custom property inside a selector** — a custom property is substituted
  into a declaration, never into a selector, so a selector that reads one is
  a rule the browser throws away whole, and the state it was to paint never
  appears on the screen;
- every declaration compiles — `tsc --noEmit` over `types/`, `vue/` and the
  switcher;
- the component browser lists exactly the themes that exist.

The rendered library is measured in a headless browser by
`node tools/audit-render.mjs`, one probe per question:

| probe | question | current run |
| --- | --- | --- |
| `contrast` | do the colours read? | 50 912 measurements, 0 failures |
| `geometry` | are the boxes where the markup asked for them? | 114 848 measurements, 0 failures |
| `package` | does the published split stylesheet measure the same? | 50 912 measurements, 0 failures |
| `motion` | does the library stop moving when the reader asks? | 3 970 measurements, 0 failures |
| `validity` | did the browser keep every rule the library declared? | 1 705 rules, 0 failures |
| `state` | does a selected thing look different from an unselected one? | 37 states, 0 failures |
| `rtl` | does the library still read from the right? | 3 693 boxes, 0 failures |
| `keyboard` | can a reader who never touches a mouse find it, name it, and see where they are? | 39 744 measurements, 0 failures |
| `moods` | do the thirty-two specimen pages read? | 45 179 measurements, 0 failures |
| `apps` | do the sixty app screens read? | 3 364 measurements, 0 failures |

Every probe exits 0 when it found nothing, 1 when it found something, and 2
when the run itself went wrong — so it can be a step in a pipeline rather
than a ritual.

The last two measure the **mood layer** — the specimens and the app packs,
which are painted with a mood's own tokens rather than with the library's
roles. `moods` found 4 402 unreadable spots on its first run and `apps`
1 106; both are at zero now. See
[docs/css-var-mapping.md §3.0](docs/css-var-mapping.md) for what the mood
layer derives and why.

### The keyboard is measured too

The other six probes look at the picture. The picture can be perfect while
the keyboard is useless: the colours are right, the boxes are where the
markup asked for them, the selected star is brighter than the unselected one
— and the focus ring is never painted, the button has no accessible name,
and a control that announces itself as an option sits outside the tab order
so the keyboard can never reach it. A reader with a keyboard would call that
library unusable, and every other instrument would say it was fine.

So the library has an instrument for the keyboard as well. It asks three
questions of every focusable control in every component's live examples:

1. **Is it named?** — a screen reader has to be able to say what it is.
2. **Is it reachable?** — the Tab key has to get there, and a control that
   claims an interactive role has to be in the tab order to keep that claim.
3. **Is it visible?** — when it has the focus, the reader has to see it, and
   the ring has to read against whatever it sits on at 3:1, which is what
   WCAG 2.2 asks of a non-text indicator.

The probe presses a real Tab key before it measures, because the browser
only paints a `:focus-visible` ring when the reader's last interaction was
a keypress — and a probe that focused things with a script would be asking
the browser a question it will answer "no" to, and blaming the library for
the answer. When the browser will not play along, the probe falls back to
the stylesheet instead of reporting a library as broken.

```bash
node tools/audit-render.mjs keyboard
```

It found **7 475 failures** in four classes the first time it ran, and all four
are fixed: the focus ring was painted in the raw brand colour, which in several
moods did not read against the surface it sat on; a number of controls had no
ring of the library's own; a few fields had no name; and two components put
an interactive role on a wrapper while the real control was a radio inside
it. It reads 39 744 measurements and **0 failures** now, and it reads them in
a browser that has been told a real Tab key was pressed — a probe that
focused things with a script would ask the browser a question it answers
"no" to, and blame the library for the answer.

The fixes were measured, not asserted: the ring has a role of its own
(`--um-focus-ring`) with the surfaces it can land on written into the
contract; thirteen components that painted no ring of their own have one; the
virtual select's rows and the tabs' labels no longer claim a role the keyboard
cannot reach; and every focusable thing the probe found is named.

### The API is compared against Element Plus itself

Covering all 82 of Element Plus's components is one thing; offering the same
**API** is another. The library is compared against Element Plus's own
published metadata — the `web-types.json` its documentation build generates,
and the TypeScript declarations in the published package — not against a
prose description of it.

```bash
npm run audit-ep-api          # write the report, fail while gaps are left
node tools/ep-api-parity.mjs --check   # fail if the report is out of date
```

Every prop Element Plus declares gets one of five verdicts: **covered**
(this library declares a prop with that name), **renamed** (it declares it
under another name, and the table says which), **equivalent** (this library
expresses it as a value of another prop), **skipped** (this library does not
carry it, and says why), or a **gap** (it does not carry it and has not said
why — a gap is the work list).

The skips are grouped into seven reasons, not written out one prop at a time:
a prop that needs JavaScript, a value the host supplies, data for the host to
render, a component to put in a slot, a place in the DOM, a duration, an
attribute of the native element, or a style string the host passes.

The report lives in [`docs/ep-api-parity.md`](./docs/ep-api-parity.md), and
`validate` checks that it still matches the sources — a stale report is a
wrong report.

## Current moods

32 style specimens, from quiet editorial to loud arcade:

| Mood | nameZh | Appearance | Character |
| --- | --- | --- | --- |
| [anime](moods/anime/specimen.html) | 动漫 | light | kawaii stickers, thick outlines, candy energy |
| [archive](moods/archive/specimen.html) | 档案 | light | paper-and-ink serif, stamps and hairlines |
| [aurora](moods/aurora/specimen.html) | 极光 | dark | northern lights, teal glow, deep blue |
| [bauhaus](moods/bauhaus/specimen.html) | 包豪斯 | light | primary colors, geometric, constructivist |
| [blueprint](moods/blueprint/specimen.html) | 蓝图 | dark | drafting sheet, white ink, uppercase condensed |
| [brutal](moods/brutal/specimen.html) | 粗野派 | light | raw black-on-white, hard offset shadows, zero radius |
| [clay](moods/clay/specimen.html) | 陶土 | light | warm matte ceramics, pill buttons, soft shadows |
| [corporate](moods/corporate/specimen.html) | 企管 | light | clean SaaS, dense data, enterprise trust |
| [crypto](moods/crypto/specimen.html) | 加密 | dark | terminal lime, monospace, high-density readouts |
| [eco](moods/eco/specimen.html) | 环保 | light | moss and linen, botanical, calm |
| [fashion](moods/fashion/specimen.html) | 时装 | light | editorial serif, asymmetric, hairline |
| [finance](moods/finance/specimen.html) | 金融 | dark | noir and gold, banking, tabular numbers |
| [food](moods/food/specimen.html) | 美食 | light | warm and appetizing, rounded, menu-first |
| [forest](moods/forest/specimen.html) | 森系 | light | moss, wood and linen, botanical and calm |
| [gaming](moods/gaming/specimen.html) | 电竞 | dark | angular HUD, cyan on black, stepped motion |
| [glass](moods/glass/specimen.html) | 毛玻璃 | dark | frosted translucent panels, violet–cyan glow |
| [instrument](moods/instrument/specimen.html) | 仪表 | dark | precision monospace, hairline borders, zero radius |
| [ios](moods/ios/specimen.html) | 苹果风 | light | system type, rounded grouped cards, system blue |
| [luxury](moods/luxury/specimen.html) | 奢雅 | light | editorial serif, hairline rules, generous space |
| [medical](moods/medical/specimen.html) | 医疗 | light | clinical teal, calm, high legibility |
| [monochrome](moods/monochrome/specimen.html) | 素白 | light | pure greyscale, hairline, almost no radius |
| [neon](moods/neon/specimen.html) | 霓虹 | dark | magenta–cyan glow, cyberpunk, vivid |
| [night](moods/night/specimen.html) | 夜航 | dark | deep blue glow, monospace readouts |
| [nordic](moods/nordic/specimen.html) | 北欧 | light | scandi muted, functional, airy |
| [pastel](moods/pastel/specimen.html) | 粉彩 | light | low-saturation, soft, friendly |
| [retro](moods/retro/specimen.html) | 复古 | light | seventies paper, warm, chunky outlines |
| [sakura](moods/sakura/specimen.html) | 樱见 | light | japanese petal, gentle, soft pink |
| [swiss](moods/swiss/specimen.html) | 瑞士 | light | helvetica grid, red accent, whitespace |
| [travel](moods/travel/specimen.html) | 旅行 | light | airy sky blue, booking, friendly |
| [vaporwave](moods/vaporwave/specimen.html) | 蒸汽波 | dark | synthwave magenta–cyan, retro-future |
| [verdant](moods/verdant/specimen.html) | 磷光 | dark | phosphor terminal, scanline energy |
| [y2k](moods/y2k/specimen.html) | 千禧 | light | chrome and bubble, early-web optimism |

The registry index lives in `moods.json`; the library shows all registered
moods.

## Current app packs

14 industries, 60 mobile screens, each rendered with a mood:

| App | nameZh | Mood | Screens |
| --- | --- | --- | --- |
| [fintech](apps/fintech/screens/index.html) | 金融理财 | finance | 5 |
| [health](apps/health/screens/index.html) | 医疗健康 | medical | 5 |
| [commerce](apps/commerce/screens/index.html) | 电商零售 | corporate | 5 |
| [delivery](apps/delivery/screens/index.html) | 餐饮外卖 | food | 4 |
| [travel](apps/travel/screens/index.html) | 旅行出行 | travel | 4 |
| [education](apps/education/screens/index.html) | 在线教育 | y2k | 4 |
| [social](apps/social/screens/index.html) | 社交社区 | pastel | 4 |
| [fitness](apps/fitness/screens/index.html) | 运动健身 | gaming | 4 |
| [music](apps/music/screens/index.html) | 音乐娱乐 | vaporwave | 4 |
| [workspace](apps/workspace/screens/index.html) | 效率办公 | ios | 5 |
| [logistics](apps/logistics/screens/index.html) | 物流快递 | aurora | 4 |
| [realestate](apps/realestate/screens/index.html) | 房产家居 | nordic | 4 |
| [automotive](apps/automotive/screens/index.html) | 汽车出行 | instrument | 4 |
| [petcare](apps/petcare/screens/index.html) | 宠物生活 | sakura | 4 |

Known fidelity limits of the specimen sections and of the app pack layer are
tracked in [docs/known-gaps.md](./docs/known-gaps.md).

See [reports/m3](./reports/m3) for a qualitative comparison of text-only vs
bundle vs repo-reference delivery (the project's core motivation, measured).
*Illustrative comparison by the same agent — not double-blind, not a
published benchmark; numbers are a lower bound on text-only drift.*

## Contributing a new mood

```bash
npx ui-moods scaffold mood my-mood --name "My Mood" --name-zh "我的风格"
# edit moods/my-mood/tokens.json + prompt.md
npx ui-moods build-specimen my-mood
npx ui-moods validate --mood my-mood
```

See [docs/contribution-guide.md](./docs/contribution-guide.md). New moods must
pass `ui-moods validate` and be registered in `moods.json`.

## Contributing a new app pack

```bash
npx ui-moods scaffold app my-app --name "My App" --name-zh "我的应用" --mood glass
# edit apps/my-app/app.json  (screens are lists of blocks)
npx ui-moods build-apps my-app
npx ui-moods validate --app my-app
```

Register it in `apps.json`. The block vocabulary lives in
`tools/lib/blocks.mjs`; the shared screen stylesheet in
`templates/app/app.css`.

## License

MIT — see [LICENSE](./LICENSE).
