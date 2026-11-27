# Vue 3 components

The library is plain HTML and CSS. The Vue package is a thin layer on top of
it: every component is still markup plus a `um-` class, and the stylesheet
still decides what it looks like. A wrapper does three things and nothing
else — it applies the variant and size classes, it exposes the props the
manifest declares, and it puts the caller's content where the component
expects it.

```js
import { createApp } from "vue";
import UM from "ui-moods/vue";
import "ui-moods/components/um-components.css";
import "ui-moods/themes/all.css";

createApp(App).use(UM).mount("#app");
```

```html
<UMButton variant="primary" size="lg">Save</UMButton>
<UMButton variant="primary" size="lg">Save</UMButton>
<UMTabs name="account">
  <template #panel="{ index }"> ... </template>
</UMTabs>
```

Every component is registered twice — as `UMButton` and as `um-button` — so a
template can use whichever reads better.

## The contract

A wrapper lives in `vue/components/<id>.js` and exports one component:

```js
import { h } from "vue";

export const UMButton = {
  name: "UMButton",
  // The example of the manifest this wrapper reproduces.
  example: "variants",
  props: {
    variant: { type: String, default: "default" },
    size: { type: String, default: "md" },
    disabled: { type: Boolean, default: false },
  },
  emits: ["click"],
  setup(props, { slots, emit }) {
    return () =>
      h(
        "button",
        {
          class: [
            "um-button",
            `um-button--${props.variant}`,
            props.size !== "md" ? `um-button--${props.size}` : "",
          ],
          disabled: props.disabled || undefined,
          onClick: (e) => emit("click", e),
        },
        slots.default ? slots.default() : [],
      );
  },
};
```

The rules, and the checks that enforce them:

1. **The name is fixed.** `um-<id>` → `UM<PascalCase>`. `input-number` →
   `UMInputNumber`.

2. **The props are the manifest's props.** Same names, same types, same
   defaults. A prop the manifest does not declare is a prop the documentation
   will never mention, so the check rejects it.

3. **Only declared classes are painted.** A wrapper may emit the base class,
   a variant modifier, a size modifier and the part classes — and nothing
   else. A class the stylesheet does not have paints nothing, silently.

4. **Every declared part is rendered.** A part the manifest documents but the
   wrapper never renders is a part nobody can use.

5. **The markup is the documented markup.** The `example` field names the
   manifest example the wrapper reproduces, so a reader can compare the two.

The checker is `tools/lib/vue-check.mjs` and runs as part of
`node tools/validate.mjs`. It renders each wrapper with `@vue/server-renderer`
and compares the result against the manifest, so a wrapper that drifts is
caught by the build rather than by a user.

## What is generated

`vue/components/<id>.js` is written by hand. Two files are generated and must
never be edited:

| File | Written by |
| --- | --- |
| `vue/components/index.js` | `node tools/build-vue.mjs` |
| `vue/components/index.d.ts` | `node tools/build-vue.mjs` |

The barrel imports every wrapper, exports them, and builds the plugin. The
declaration file gives every component a props interface derived from the
manifest, so the types a consumer sees are the types the stylesheet was built
from.

## The theme

The mood in force is the `data-um-theme` attribute on `<html>`. The document
owns it, not the Vue app, so a plain HTML page, a React page and a Vue page
can share one document and one mood.

```js
import { useTheme } from "ui-moods/vue";

const { theme, setTheme, themes } = useTheme();
```

`useTheme()` returns a reactive `theme` ref, the `themes` catalogue, a
`loading` flag, `setTheme(id)` and `cycle()`. The ref follows the document
rather than the other way round, so a mood changed by hand — or in another
tab — still leaves it correct.

`<UMThemeSwitcher>` renders the picker. It takes `v-model`, and can render
as a `select` or as a row of buttons.
