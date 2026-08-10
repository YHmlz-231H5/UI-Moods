# UI Moods

**Style Specimen Registry** — a library of named UI styles ("moods") plus a
protocol that lets AI agents consume them faithfully. You pick a mood, bundle
it into a self-contained prompt package, and hand it to any coding agent
together with your functional requirements. The agent implements against the
mood's design tokens and self-checks against its acceptance checklist.

> Not a React/Vue/Svelte component library. Not a UI generator. No cloud
> service. Just files, tokens, and a clear contract for agents.

## Why

Describing visual style in text is lossy: "frosted glass", "forest" and
"apple-style" mean different things to different models. UI Moods makes style
**referable**: `mood/glass@1.0.0` points to a concrete specimen, exact design
tokens, and a machine-readable acceptance checklist.

## Quick start

```bash
# Clone first (GitHub distribution)
git clone <your-fork-or-repo-url> ui-moods
cd ui-moods
npm install

# Browse the gallery (overview, switch themes, copy tokens)
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

## Using with an AI agent

The shortest path, in four steps:

1. Pick a mood — browse the gallery or `moods/` (e.g. `glass`).
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
├─ schemas/           # tokens.schema.json · checklist.schema.json
├─ templates/mood/    # scaffolding for a new mood
├─ tools/             # cli · build-specimen · validate · bundle · serve
├─ docs/              # mapping convention · checklist semantics · contribution guide
├─ AGENTS.md          # protocol for AI agents
└─ moods.json         # registry index
```

Each mood is defined by:

- `specimen.html` — human-facing visual truth, generated from tokens
  (never hand-edit; run `ui-moods build-specimen <id>`).
- `tokens.json` — the single source of truth for colors, type, radii, borders,
  effects, shadows, spacing and motion.
- `prompt.md` — short semantic description (English first).
- `checklist.yaml` — machine-readable acceptance criteria.

## Validation guarantees

`ui-moods validate` checks, per mood:

- `tokens.json` / `checklist.yaml` conform to the schemas;
- `components` references resolve and leaves are token refs or allowlisted
  keywords;
- the generated specimen's CSS variables exactly match the tokens;
- no color literals or off-allowlist magic numbers outside the token block;
- WCAG contrast assertions pass (translucent colors are composited first).

## Current moods

| Mood | nameZh | Appearance | Character |
| --- | --- | --- | --- |
| [anime](moods/anime/specimen.html) | 动漫 | light | kawaii stickers, thick outlines, candy energy |
| [archive](moods/archive/specimen.html) | 档案 | light | paper-and-ink serif, stamps and hairlines |
| [blueprint](moods/blueprint/specimen.html) | 蓝图 | dark | drafting sheet, white ink, uppercase condensed |
| [clay](moods/clay/specimen.html) | 陶土 | light | warm matte ceramics, pill buttons, soft shadows |
| [forest](moods/forest/specimen.html) | 森系 | light | moss, wood and linen, botanical and calm |
| [glass](moods/glass/specimen.html) | 毛玻璃 | dark | frosted translucent panels, violet–cyan glow |
| [instrument](moods/instrument/specimen.html) | 仪表 | dark | precision monospace, hairline borders, zero radius |
| [ios](moods/ios/specimen.html) | 苹果风 | light | system type, rounded grouped cards, system blue |
| [luxury](moods/luxury/specimen.html) | 奢雅 | light | editorial serif, hairline rules, generous space |
| [night](moods/night/specimen.html) | 夜航 | dark | deep blue glow, monospace readouts |
| [verdant](moods/verdant/specimen.html) | 磷光 | dark | phosphor terminal, scanline energy |

The registry index lives in `moods.json`; the gallery shows all registered
moods.

Known fidelity limits of the single matrix template are tracked in
[docs/known-gaps.md](./docs/known-gaps.md).

See [reports/m3](./reports/m3) for a qualitative comparison of text-only vs
bundle vs repo-reference delivery (the project's core motivation, measured).
*Illustrative comparison by the same agent — not double-blind, not a
published benchmark; numbers are a lower bound on text-only drift.*

## Contributing a new mood

See [docs/contribution-guide.md](./docs/contribution-guide.md). New moods must
pass `ui-moods validate` and be registered in `moods.json`.

## License

MIT — see [LICENSE](./LICENSE).
