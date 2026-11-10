# Release steps

v1 distribution model: **GitHub-only** (clone → `npm install` → `npx ui-moods …`).
An npm registry publish is a post-v1 milestone and would add `files`,
`repository`/`bugs`/`homepage`, and `publishConfig.access` when it happens.

## What a release contains

| Artifact | Source of truth | Generated |
| --- | --- | --- |
| `moods/<id>/tokens.json` | hand-authored | — |
| `moods/<id>/prompt.md` · `checklist.yaml` | hand-authored | — |
| `moods/<id>/specimen.html` | `templates/mood/specimen.html` + `templates/mood/sections/*.html` | `build-specimen` |
| `apps/<id>/app.json` | hand-authored | — |
| `apps/<id>/screens/*.html` | `apps/<id>/app.json` + `templates/app/app.css` | `build-apps` |

Everything under `moods/*/specimen.html` and `apps/*/screens/` is **generated
output** and must be regenerated and committed together with its source.

## Tag a release

```bash
# 1. Bump the version
npm version 1.1.0            # updates package.json + creates the tag

# 2. Regenerate every generated artifact
npm run build:all

# 3. Validate the whole registry (moods + apps + registry coherence)
npm install
npm run validate             # expect 32/32 moods PASS, 14/14 apps PASS, registry PASS

# 4. Commit and tag
git add -A
git commit -m "release: ui-moods v1.1.0"
git tag v1.1.0

# 5. Push (once a remote is configured)
git push origin main --tags
```

CI (`validate` workflow) runs on push to `main` and on pull requests; a green
run on the tag commit is the release gate.

## Regenerating after a template change

A change to `templates/mood/specimen.html`, `templates/mood/sections/*.html`
or `templates/app/app.css` affects every mood and every app. Always run
`npm run build:all` and commit the regenerated files together with the
template change — otherwise `validate` will fail on stale specimens.
