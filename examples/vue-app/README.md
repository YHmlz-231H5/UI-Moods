# A real Vue 3 application that uses the library

This is not a snippet in the documentation. It is a Vite + Vue 3 project that
installs `ui-moods` from the repository and builds with `vite build`, and it is
how the package's public names are proved to work in an ordinary project: the
imports below are the names a consumer would type, resolved through the
package's `exports` field.

```js
import UM from "ui-moods/vue";
import "ui-moods/css/all.css";
import "ui-moods/themes/all.css";
```

The third import carries **all 32 moods in one stylesheet**, so switching a
mood is an attribute on the document:

```js
document.documentElement.setAttribute("data-um-theme", "night");
```

That costs no network request — the browser already has every mood, and the
cascade picks the one the attribute names. `useTheme()` from `ui-moods/vue` is
a thin wrapper around exactly that, and the same attribute can be set by hand,
or by the framework-agnostic `themes/switcher.js`.

## Running it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # the production build
```

`npm install` resolves `ui-moods` from `file:../..`, so the example always
builds against the working tree rather than against a published version. To
try it against the published package instead, change that one line in
`package.json`.

## What it shows

- The components are Vue components, but they are plain markup with a `um-`
  class underneath — the stylesheet decides what they look like.
- `v-model` works on every value-bearing component: `UMInput`, `UMSwitch`
  and `UMRadioGroup` are bound in `src/App.vue`.
- The host's own layout is the host's business. The library states its box
  model for the elements it paints and for nothing else.
