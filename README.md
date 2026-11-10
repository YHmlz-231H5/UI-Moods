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

> Not a React/Vue/Svelte component library. Not a UI generator. No cloud
> service. Just files, tokens, and a clear contract for agents.

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

> Distribution model (v1): **GitHub-only**. `npx ui-moods …` works after
> `npm install` inside the cloned repository; a standalone npm registry
> publish is a post-v1 milestone. Release steps: `docs/release.md`.

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
├─ schemas/           # tokens.schema.json · checklist.schema.json · allowlist.json
├─ templates/
│  ├─ mood/           # specimen shell + sections/*.html partials
│  └─ app/            # app.css (shared screen stylesheet)
├─ tools/             # cli · build-specimen · build-apps · validate · bundle · serve · scaffold
├─ docs/              # mapping convention · checklist semantics · contribution guide
├─ AGENTS.md          # protocol for AI agents
├─ moods.json         # style registry index
└─ apps.json          # app registry index
```

### A mood is four files

- `specimen.html` — human-facing visual truth, generated from tokens
  (never hand-edit; run `ui-moods build-specimen <id>`). Assembled from
  `templates/mood/specimen.html` plus the 27 section partials in
  `templates/mood/sections/` (palette & type, logo & buttons, cards & table,
  navigation, hero, forms, data display, charts, stats, feedback, layouts,
  tabs, timeline, user, media, pricing, testimonials, FAQ, footer, ecommerce,
  dashboard, settings, onboarding, chat, content, calendar, kanban).
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
