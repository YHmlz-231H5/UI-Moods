# Example prompts

Copy-paste templates for driving an AI agent with UI Moods. All follow the
ordering conventions from the README's "Using with an AI agent" section.

**Style layer** — fixes how the interface looks:

- [`bundle-glass.md`](./bundle-glass.md) — one-off usage via the bundle
  prompt package (fastest path).
- [`repo-reference.md`](./repo-reference.md) — long-lived usage via
  `style: mood/<id>@<version>` inside a cloned repository.

**App layer** — fixes how the product flows:

- [`app-commerce.md`](./app-commerce.md) — reuse an industry screen pack
  (`app/commerce@1.0.0`) for layout and flow, plus a mood bundle for the
  visual language.
