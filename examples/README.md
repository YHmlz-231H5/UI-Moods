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

**The library itself** — a runnable project rather than a prompt:

- [`vue-app/`](./vue-app) — a real Vue 3 + Vite application that installs the
  package and uses it: the components, `v-model` on the value-bearing ones, and
  a mood switcher that costs no network request. It is how the package's
  public names are proved to work in an ordinary project.
