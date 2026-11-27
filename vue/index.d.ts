// ui-moods · Vue 3 bindings — types
//
// The runtime lives in `vue/index.js`; this file is the declaration that lets
// a TypeScript Vue project import it without `any`.

import type { Component, Ref } from "vue";
import type { ThemeEntry, ThemeId } from "../types/index.js";

// The theme and component types are re-exported by name rather than with
// `export *`, because the component catalogue and the Vue component map are
// both called `components` and a wildcard would make the name ambiguous.
export type {
  ThemeId,
  ThemeAppearance,
  ThemeEntry,
  ThemeCatalogue,
  ThemeIndex,
  ComponentId,
  ComponentCatalogueEntry,
} from "../types/index.js";

export * from "./components/index.js";

/**
 * A reactive handle on the mood in force.
 *
 * The document is the source of truth: the `data-um-theme` attribute on
 * `<html>` is what actually decides the mood, and this handle follows it.
 */
export interface UseThemeOptions {
  /** Where the remembered mood is kept. Defaults to `um-theme`. */
  storageKey?: string;
  /** Where `themes/index.json` lives. Defaults to the folder next to this module. */
  base?: string;
  /** Set to `false` to skip loading the catalogue entirely. */
  catalogue?: boolean;
}

export interface UseThemeReturn {
  /** The mood in force. */
  theme: Ref<ThemeId | null>;
  /** The catalogue, once it has loaded. */
  themes: Ref<ThemeEntry[]>;
  /** True while the catalogue is in flight. */
  loading: Ref<boolean>;
  /** Put a mood on the document. */
  setTheme(id: ThemeId | string): ThemeId | string | null;
  /** Step to the next mood in the catalogue. */
  cycle(): ThemeId | string | null;
}

/** The mood the document is wearing right now. */
export declare function currentTheme(): ThemeId | null;

/** Write the mood onto the document, and announce it. */
export declare function applyTheme(id: ThemeId | string | null): ThemeId | string | null;

/** A reactive handle on the mood. */
export declare function useTheme(options?: UseThemeOptions): UseThemeReturn;

/** A theme picker. */
export declare const UMThemeSwitcher: Component;

declare const _default: {
  install: typeof install;
  useTheme: typeof useTheme;
  UMThemeSwitcher: typeof UMThemeSwitcher;
  currentTheme: typeof currentTheme;
  applyTheme: typeof applyTheme;
};

export default _default;

/** Install the library into a Vue app. */
export declare function install(app: any): any;
