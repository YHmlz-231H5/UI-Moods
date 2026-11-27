# Release steps

v1 distribution model: **GitHub-first, npm-ready**. `npx ui-moods …` works
after `npm install` inside the cloned repository, and the component library is
packaged for the npm registry — but the publish itself has not been done.

## What a release contains

| Artifact | Source of truth | Generated |
| --- | --- | --- |
| `moods/<id>/tokens.json` | hand-authored | — |
| `moods/<id>/prompt.md` · `checklist.yaml` | hand-authored | — |
| `moods/<id>/specimen.html` | `templates/mood/specimen.html` + `templates/mood/sections/*.html` | `build-specimen` |
| `apps/<id>/app.json` | hand-authored | — |
| `apps/<id>/screens/*.html` | `apps/<id>/app.json` + `templates/app/app.css` | `build-apps` |
| `components/<id>/manifest.json` · `style.css` | hand-authored | — |
| `components/um-components.css` | the manifests | `build-components` |
| `css/base.css` · `css/<id>.css` · `css/all.css` | the manifests | `build-dist` |
| `site/component/<id>.html` | the manifests | `build-docs` |
| `types/index.d.ts` | the manifests | `build-types` |
| `vue/components/<id>.js` · `index.js` | the manifests | `build-vue` |
| `themes/<id>.css` · `themes/all.css` | `moods/<id>/tokens.json` | `build-themes` |

Everything under `moods/*/specimen.html` and `apps/*/screens/` is **generated
output** and must be regenerated and committed together with its source. So
are the four generated artefacts of the component layer — the whole
stylesheet, the split stylesheet, the types and the Vue barrel.

## Tag a release

```bash
# 1. Bump the version
npm version 1.1.0            # updates package.json + creates the tag

# 2. Regenerate every generated artifact
npm run build:all            # the moods and the app packs
npm run build:package        # the component layer: css, docs, types, vue, dist

# 3. Validate the whole registry (moods + apps + registry coherence)
npm install
npm run validate             # expect 32/32 moods PASS, 14/14 apps PASS, registry PASS

# 4. Measure the rendered result
node tools/audit-render.mjs contrast      # 51 328 measurements, 0 failures
node tools/audit-render.mjs geometry      # 115 488 measurements, 0 failures
node tools/audit-render.mjs package       # the split stylesheet, same numbers
node tools/audit-render.mjs motion --reduced-motion   # the motion contract
node tools/audit-render.mjs validity      # the rules the browser kept
node tools/audit-render.mjs state         # the states the reader sees

# 5. Commit and tag
git add -A
git commit -m "release: ui-moods v1.1.0"
git tag v1.1.0

# 6. Push (once a remote is configured)
git push origin main --tags
```

CI (`validate` workflow) runs on push to `main` and on pull requests; a green
run on the tag commit is the release gate.

## Publishing to the npm registry

The package is ready to publish and has not been published. The name
`ui-moods` is free on the npm registry. The metadata is in `package.json`:
`repository`, `bugs` and `homepage` point at the GitHub repository, and
`publishConfig.access` is `public` — an unscoped package can only be public,
so the field states the intent rather than changing the outcome.

What is left is one step, and it is yours because the registry asks for a
login this session cannot answer:

```bash
npm login             # or: npm adduser
npm run build:package # the published files are generated
npm pack --dry-run    # 601 files, 862 KB — check what went in
npm publish
```

`npm pack` includes only what `files` names: the component layer, the split
stylesheet, the 32 moods, the Vue package, the types, the token contract, the
schemas, the build tools and the mood/app *sources*. The generated specimen
pages and app screens are not in it — they are large, they are generated, and
they live in the repository. A CLI command that needs them says so rather
than failing on a missing file.

The example application under `examples/vue-app/` ships as source — its
`node_modules` and its `dist` are kept out by an `.npmignore` beside it, so
a consumer who installs the package can read a working project that uses it.

## Regenerating after a template change

A change to `templates/mood/specimen.html`, `templates/mood/sections/*.html`
or `templates/app/app.css` affects every mood and every app. Always run
`npm run build:all` and commit the regenerated files together with the
template change — otherwise `validate` will fail on stale specimens.

A change to a component's `manifest.json` or `style.css` affects the four
generated artefacts of the component layer. Run `npm run build:package` and
commit them together — `validate` fails on a stylesheet that is out of date
with its partials, and `check-package` fails on a split stylesheet that no
longer matches the whole one.
