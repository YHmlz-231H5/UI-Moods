# Example · Bundle usage (glass)

## Step 1 — generate the bundle

```bash
npx ui-moods bundle glass > glass.prompt.md
```

## Step 2 — paste into your agent chat

Paste the entire generated `glass.prompt.md` first, then paste the section
below.

## Requirement

Build a settings page with:

- profile form: name, email, notes (textarea)
- actions: Save (primary), Cancel, Delete account (danger)
- an Active status badge
- a 62% profile-completeness progress bar
- one info notice

## Delivery rules

- Use only the tokens from the bundle above.
- Self-check against its acceptance checklist before delivery.
- Cite the mood version in your summary: `mood/glass@1.0.0`.
