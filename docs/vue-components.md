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

## The binding

Every value-bearing component answers to `v-model` as well as to its own prop.
Element Plus, Arco Design and Naive UI all work this way, and a Vue component
library that does not is a real adoption blocker: a form is the one thing a
component library is *for*.

```vue
<UMSwitch v-model="notify" />
<UMInput v-model="name" />
<UMRadioGroup v-model="plan">
  <UMRadio value="free">Free</UMRadio>
  <UMRadio value="pro">Pro</UMRadio>
</UMRadioGroup>
<UMCheckboxGroup v-model="tags">
  <UMCheckbox value="a">A</UMCheckbox>
</UMCheckboxGroup>
```

**The binding is additive, not a replacement.** A component keeps the prop it
had — `checked` on a switch, `value` on an input — and the binding wins when
it is there:

```vue
<UMSwitch :checked="on" />     <!-- still works -->
<UMSwitch v-model="on" />      <!-- the binding is in force -->
```

The distinction that makes this work is `undefined`. A prop that was not
passed is `undefined`, which is not the same as `false`, `0` or `""` — so a
host that binds a false value has that false value stick, rather than being
overruled by the fallback. `vue/lib/model.mjs` holds the one line that decides
it.

**A group owns the selection.** A radio group is not a box around some radios
— it is the thing that decides which one of them is picked. The group
publishes its value and its options ask for it, through Vue's own
`provide`/`inject`, which follows the component tree rather than the DOM. So
the options inside a group follow the group's binding, and the group's value
is one string (a radio group) or a list (a checkbox group).

**The declaration has to say so.** `v-model` is the `modelValue` prop *and* the
`update:modelValue` event. A declaration that mentions only the prop is a
component that cannot be bound, and the mistake is invisible until a consumer
writes `v-model` in a template and their editor says no. So
`tools/build-vue.mjs` writes the event into the declaration, and
`type-tests/v-model.d.ts` asserts — at compile time — that both halves are
there.

**And the binding has to bind.** A component can declare `modelValue`, accept
it, and then ignore it, and every agreement check in this repository would
still pass. So `node tools/check-v-model.mjs` uses the components rather than
looking at them: it mounts them in a renderer that draws nothing and
remembers everything, presses the controls, and checks that a change publishes
the new value — and that the group's value reaches an option written
somewhere else entirely.

| Check | What it proves |
| --- | --- |
| `check-vue.mjs` | the wrapper and the manifest agree |
| `check-v-model.mjs` | the binding binds, and the group reaches its options |
| `tsc` on `type-tests/` | the declaration carries both halves of `v-model` |

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
