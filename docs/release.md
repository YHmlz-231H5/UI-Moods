# Release steps

v1 distribution model: **GitHub-only** (clone → `npm install` → `npx ui-moods …`).
An npm registry publish is a post-v1 milestone and would add `files`,
`repository`/`bugs`/`homepage`, and `publishConfig.access` when it happens.

## Tag a release (v1.0.0 as reference)

```bash
# 1. Bump the version
sed -i 's/"version": ".*"/"version": "1.0.0"/' package.json

# 2. Validate the whole registry
npm install
npm run validate            # expect 11/11 PASS

# 3. Commit and tag
git add -A
git commit -m "release: ui-moods v1.0.0"
git tag v1.0.0

# 4. Push (once a remote is configured)
git push origin main --tags
```

CI (`validate` workflow) runs on push to `main` and on pull requests; a green
run on the tag commit is the release gate.
