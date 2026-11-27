// ui-moods · Vue 3 bindings
//
// The library is plain HTML and CSS; this is the thin Vue-shaped edge on it.
// Nothing here reimplements a component — every component is still markup
// plus a `um-` class, and the CSS still decides what it looks like.
//
//   import { useTheme, UMThemeSwitcher } from "ui-moods/vue";
//
//   <script setup>
//   const { theme, setTheme, themes } = useTheme();
//   </script>
//
//   <UMThemeSwitcher v-model="theme" />
//
// Two rules this file follows:
//
//   - **No build step.** It is a plain ES module with render functions rather
//     than single-file components, so a Vue project can use it with Vite,
//     with Nuxt, with a plain `<script type="module">`, or with nothing at
//     all. Vue itself is the only peer dependency, and it is the host's.
//
//   - **The document owns the mood, not this file.** The mood in force is
//     the `data-um-theme` attribute on `<html>`. This module reads it,
//     writes it, and keeps a reactive copy — it never becomes the source of
//     truth, so a plain HTML page, a React page and a Vue page can share one
//     document and one mood.

import { ref, onMounted, onBeforeUnmount, getCurrentInstance, h, computed } from "vue";
import UMComponents, { install as installComponents } from "./components/index.js";

// Every component the package ships, re-exported from one place, so that a
// consumer writes one import rather than thirty.
export * from "./components/index.js";

const ATTR = "data-um-theme";
const STORAGE_KEY = "um-theme";

/** The mood the document is wearing right now. */
export function currentTheme() {
  if (typeof document === "undefined") return null;
  return document.documentElement.getAttribute(ATTR) || null;
}

/**
 * Write the mood onto the document.
 *
 * The same event the plain switcher announces, so that anything watching the
 * document hears a mood change whether it came from Vue, from
 * `themes/switcher.js`, or from another tab.
 */
export function applyTheme(id) {
  if (typeof document === "undefined" || !id) return null;
  document.documentElement.setAttribute(ATTR, id);
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch (e) {
    /* private mode: the mood simply does not persist */
  }
  try {
    document.documentElement.dispatchEvent(
      new CustomEvent("um-theme-change", { detail: { theme: id }, bubbles: true }),
    );
  } catch (e) {
    /* CustomEvent is unavailable in very old engines; the attribute still changed */
  }
  return id;
}

/**
 * A reactive handle on the mood.
 *
 * `useTheme()` returns:
 *
 *   theme   — a ref holding the mood in force
 *   setTheme(id) — put a mood on the document
 *   themes  — the catalogue, once it has loaded
 *   loading — true while the catalogue is in flight
 */
export function useTheme(options = {}) {
  const storageKey = options.storageKey ?? STORAGE_KEY;
  const theme = ref(currentTheme());

  // The document is the source of truth, so the ref follows it rather than
  // the other way round. A component that sets the mood by hand, or another
  // tab, still leaves this ref correct.
  const onStorage = (e) => {
    if (e.key === storageKey && e.newValue) theme.value = e.newValue;
  };
  if (typeof window !== "undefined") {
    window.addEventListener("storage", onStorage);
  }

  // The lifecycle hooks only exist inside a component. A composable is often
  // called from a store or a plain module instead, and registering a hook
  // there is a warning at best — so it is done only when there is a
  // component to register it on.
  const inComponent = getCurrentInstance() !== null;
  if (inComponent) {
    onBeforeUnmount(() => {
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", onStorage);
      }
    });
  }

  // A mood named in the URL wins over the remembered one; a link with
  // `?theme=glass` should show glass, whatever the last visit chose.
  const applyWanted = () => {
    let wanted = null;
    try {
      wanted = new URLSearchParams(window.location.search).get("theme");
    } catch (e) {
      wanted = null;
    }
    if (!wanted) {
      try {
        wanted = localStorage.getItem(storageKey);
      } catch (e) {
        wanted = null;
      }
    }
    if (wanted) {
      applyTheme(wanted);
      theme.value = wanted;
    }
  };
  if (inComponent) onMounted(applyWanted);
  else applyWanted();

  const themes = ref([]);
  const loading = ref(false);
  if (options.catalogue !== false && typeof fetch !== "undefined") {
    loading.value = true;
    // The catalogue is looked for next to this module, not next to the
    // page: a host's document and this file usually live in different
    // places.
    let base = options.base;
    if (!base) {
      try {
        base = new URL("../themes/", import.meta.url).href;
      } catch (e) {
        base = "themes/";
      }
    }
    base = base.replace(/\/?$/, "/");
    fetch(base + "index.json")
      .then((r) => r.json())
      .then((data) => {
        themes.value = data.themes ?? [];
      })
      .catch(() => {
        themes.value = [];
      })
      .finally(() => {
        loading.value = false;
      });
  }

  const setTheme = (id) => {
    if (!id) return theme.value;
    applyTheme(id);
    theme.value = id;
    return id;
  };

  /** Step to the next mood in the catalogue. */
  const cycle = () => {
    const list = themes.value.map((t) => t.id);
    if (!list.length) return theme.value;
    const i = list.indexOf(theme.value);
    return setTheme(list[(i + 1) % list.length]);
  };

  return { theme, themes, loading, setTheme, cycle };
}

/**
 * A theme picker.
 *
 * Render-function rather than a single-file component, so the package needs
 * no build step. The list of moods comes from `themes/index.json` unless the
 * host passes one.
 */
export const UMThemeSwitcher = {
  name: "UMThemeSwitcher",
  props: {
    modelValue: { type: String, default: "" },
    /** `themes/index.json`, or a list of ids. */
    catalogue: { type: [Array, Object], default: null },
    /** Where `index.json` lives. Defaults to the folder next to this module. */
    base: { type: String, default: "" },
    label: { type: String, default: "Theme" },
    /** `select` is the default; `buttons` shows them all. */
    variant: { type: String, default: "select" },
  },
  emits: ["update:modelValue", "change"],
  setup(props, { emit }) {
    const { theme, themes, loading } = useTheme({ base: props.base });

    const list = computed(() => {
      if (Array.isArray(props.catalogue)) return props.catalogue.map(String);
      if (props.catalogue && Array.isArray(props.catalogue.themes)) {
        return props.catalogue.themes.map((t) => (typeof t === "string" ? t : t.id));
      }
      return themes.value.map((t) => t.id);
    });

    const current = computed(() => props.modelValue || theme.value || "");

    const choose = (id) => {
      theme.value = id;
      emit("update:modelValue", id);
      emit("change", id);
    };

    return () => {
      if (props.variant === "buttons") {
        return h(
          "div",
          { class: "um-theme-switcher um-theme-switcher--buttons" },
          list.value.map((id) =>
            h(
              "button",
              {
                key: id,
                type: "button",
                class: [
                  "um-button",
                  "um-button--default",
                  "um-button--sm",
                  id === current.value ? "um-button--primary" : "",
                ].filter(Boolean),
                "aria-pressed": id === current.value ? "true" : "false",
                onClick: () => choose(id),
              },
              id,
            ),
          ),
        );
      }
      return h("div", { class: "um-theme-switcher" }, [
        h("label", { class: "um-theme-switcher__label", for: "um-theme-picker" }, props.label),
        h(
          "select",
          {
            id: "um-theme-picker",
            class: "um-theme-switcher__select",
            value: current.value,
            disabled: loading.value && !list.value.length,
            onChange: (e) => choose(e.target.value),
          },
          list.value.map((id) => h("option", { key: id, value: id }, id)),
        ),
      ]);
    };
  },
};

export default { install, useTheme, UMThemeSwitcher, currentTheme, applyTheme, ...UMComponents };

/**
 * Install the library into a Vue app.
 *
 *   import { createApp } from "vue";
 *   import UM from "ui-moods/vue";
 *   createApp(App).use(UM).mount("#app");
 *
 * Every component is registered twice — as `UMButton` and as `um-button` —
 * so a template can use whichever reads better.
 */
export function install(app) {
  installComponents(app);
  return app;
}
