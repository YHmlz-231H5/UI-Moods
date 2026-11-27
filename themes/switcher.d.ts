// ui-moods · theme switcher — types
//
// The switcher is a plain script: it attaches one global, `UMTheme`, and the
// mood itself lives on the document as `data-um-theme`. A page that loads it
// with a `<script>` tag can then call `UMTheme.set("night")`; a page that
// does not load it sets the attribute itself.
//
// The declaration below is for the TypeScript and Vue consumers.

/** The moods the library ships, split by how they read. */
export interface ThemeCatalogue {
  /** Every mood id. */
  all: string[];
  /** The moods that read as light. */
  light: string[];
  /** The moods that read as dark. */
  dark: string[];
}

/** The API the switcher attaches to the window. */
export interface UMThemeApi {
  /** Put a mood on the document. A mood that does not exist is refused. */
  set(id: string): string | null;
  /** The mood in force right now. */
  get(): string | null;
  /** The catalogue, fetched once. */
  list(): Promise<ThemeCatalogue>;
  /** Step to the next mood in the catalogue. */
  cycle(): Promise<string | null>;
  /** The attribute the mood is written to. */
  readonly attribute: string;
  /** Where the remembered mood is kept. */
  readonly storageKey: string;
}

declare global {
  interface Window {
    /** The switcher API. Present once `themes/switcher.js` has run. */
    UMTheme?: UMThemeApi;
    /** An optional list of moods, so the switcher can refuse a typo early. */
    UM_THEMES?: string[] | Record<string, string[]>;
    /** An optional override for where `themes/index.json` lives. */
    UM_THEME_BASE?: string;
  }
}

export {};
