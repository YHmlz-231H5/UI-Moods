# Example · Repository reference (clay)

Use this when the agent can read this repository (clone, submodule, or npm
dependency) and its `AGENTS.md`.

## Prompt

```text
style: mood/clay@1.0.0 from ui-moods

Build: a settings page with a profile form (name, email, notes),
Save (primary) / Cancel / Delete account (danger) buttons, an Active
status badge, a 62% progress bar, and one info notice.

Rules: colors/radii/spacing/effects only from that mood's tokens;
run through its checklist before delivery; cite the mood version
(mood/clay@1.0.0) in your summary.
```

## Prerequisites

- The agent can read `AGENTS.md` and `moods/clay/`.
- Optionally verify before delivery: `npx ui-moods validate --mood clay`.
