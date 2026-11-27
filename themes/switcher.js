// ui-moods · theme switcher
//
// The library's whole state is one attribute on the document element:
//
//   <html data-um-theme="night">
//
// Every theme file claims its own scope at a specificity one step above
// `:root`, so when several of them are on the page the one whose id matches
// the attribute wins the cascade — whatever order the files were linked in.
// Linking `themes/all.css` once therefore means that switching a mood costs
// **no network request at all**. The style changes before the browser has
// finished a frame.
//
//   <link rel="stylesheet" href="components/um-components.css">
//   <link rel="stylesheet" href="themes/all.css">
//   <script src="themes/switcher.js"></script>
//
//   UMTheme.set("night")
//
// This file is the only JavaScript the project ships, and it belongs to the
// consumption of the library rather than to the library itself: the
// components are still markup plus classes, and the library still has no
// runtime dependency. Drop the script in and you get a remembered switcher;
// leave it out and you set the attribute yourself.
//
// It is framework-agnostic on purpose. A Vue app, a React app and a plain
// HTML page all call the same three lines.

/**
 * @param {any} global the window, or `this` when there is no window
 */
(function (global) {
  "use strict";

  var KEY = "um-theme";
  var ATTR = "data-um-theme";

  var root = global.document && global.document.documentElement;
  if (!root) return;

  // Where this script lives, so that the catalogue is looked for next to it
  // rather than next to the page. A script that resolves its own paths
  // relative to the document breaks the moment the document moves — which is
  // exactly what happens when the documentation site lives in `site/` and
  // the library lives in `themes/`.
  /** @type {string | null} */
  var selfUrl = null;
  try {
    var script = /** @type {HTMLScriptElement | null} */ (global.document.currentScript);
    selfUrl = script && script.src ? script.src : null;
  } catch (e) {
    selfUrl = null;
  }

  /** @type {{ all: string[], light: string[], dark: string[] } | null} */
  var catalogue = null;
  /** @type {Promise<{ all: string[], light: string[], dark: string[] }> | null} */
  var cataloguePromise = null;

  // The moods that exist, when the host already knows them. A page that
  // inlines the list can refuse a typo immediately; a page that does not
  // learns the list when the catalogue is fetched.
  /** @type {Set<string> | null} */
  var known = null;
  if (global.UM_THEMES) {
    var groups = global.UM_THEMES;
    /** @type {string[]} */
    var ids = [];
    if (Array.isArray(groups)) ids = groups.slice();
    else if (groups && typeof groups === "object") {
      for (var key in groups) {
        if (Object.prototype.hasOwnProperty.call(groups, key) && Array.isArray(groups[key])) {
          ids = ids.concat(groups[key]);
        }
      }
    }
    if (ids.length) known = new Set(ids);
  }

  /** @returns {string | null} */
  function readStored() {
    try {
      return global.localStorage.getItem(KEY);
    } catch (e) {
      return null; // private mode, or storage disabled
    }
  }

  /** @param {string} id */
  function writeStored(id) {
    try {
      global.localStorage.setItem(KEY, id);
    } catch (e) {
      /* the mood simply does not persist */
    }
  }

  /** @returns {string | null} */
  function fromUrl() {
    try {
      return new URLSearchParams(global.location.search).get("theme");
    } catch (e) {
      return null;
    }
  }

  /**
   * The theme in force right now.
   *
   * The attribute is the truth, because it is what the cascade reads. The
   * stored value is only consulted when the document has not been given one.
   *
   * @returns {string | null}
   */
  function get() {
    return root.getAttribute(ATTR) || null;
  }

  /**
   * Announce a mood change, so that anything watching the document — a
   * picker, a preview, another component — can follow it.
   *
   * @param {string} id
   */
  function announce(id) {
    try {
      root.dispatchEvent(
        new CustomEvent("um-theme-change", { detail: { theme: id }, bubbles: true }),
      );
    } catch (e) {
      /* CustomEvent is unavailable in very old engines; the attribute still changed */
    }
  }

  /**
   * Apply a mood. Returns the id that ended up in force, which is the given
   * id when it was usable and the current one otherwise.
   *
   * A mood that does not exist is refused when the list is known. Setting an
   * attribute that names nothing would otherwise strip the page of its
   * variables and leave it wearing whichever mood happened to be linked
   * last.
   *
   * @param {string} id
   * @returns {string | null}
   */
  function set(id) {
    if (!id) return get();
    if (known && !known.has(id)) return get();
    root.setAttribute(ATTR, id);
    writeStored(id);
    announce(id);
    return id;
  }

  /**
   * The catalogue of moods, fetched once.
   *
   * Returns a promise so the caller can decide whether to wait; the switcher
   * itself never blocks on it.
   *
   * @returns {Promise<{ all: string[], light: string[], dark: string[] }>}
   */
  function list() {
    if (catalogue) return Promise.resolve(catalogue);
    if (!cataloguePromise) {
      var base = global.UM_THEME_BASE;
      if (!base) {
        try {
          base = selfUrl ? new URL(".", selfUrl).href : "themes/";
        } catch (e) {
          base = "themes/";
        }
      }
      base = base.replace(/\/?$/, "/");
      cataloguePromise = fetch(base + "index.json")
        .then(function (r) {
          return r.json();
        })
        .then(function (data) {
          var themes = data.themes ?? [];
          catalogue = {
            all: themes.map(function (t) {
              return t.id;
            }),
            light: themes
              .filter(function (t) {
                return t.appearance !== "dark";
              })
              .map(function (t) {
                return t.id;
              }),
            dark: themes
              .filter(function (t) {
                return t.appearance === "dark";
              })
              .map(function (t) {
                return t.id;
              }),
          };
          known = new Set(catalogue.all);
          return catalogue;
        })
        .catch(function () {
          catalogue = { all: [], light: [], dark: [] };
          return catalogue;
        });
    }
    return cataloguePromise;
  }

  /**
   * Step to the next mood. Handy for a demo, and for checking that every
   * mood really does hold together.
   *
   * @returns {Promise<string | null>}
   */
  function cycle() {
    return list().then(function (c) {
      if (!c.all.length) return get();
      var i = c.all.indexOf(get());
      var next = c.all[(i + 1) % c.all.length];
      return set(next);
    });
  }

  // Apply the mood the visitor last chose, or the one the link names.
  //
  // The URL wins over the stored choice: it is an explicit instruction, and
  // a link with `?theme=night` should show what it says rather than whatever
  // the last visit left behind.
  (function init() {
    var wanted = fromUrl();
    if (!wanted) wanted = readStored();
    if (wanted) root.setAttribute(ATTR, wanted);
  })();

  // Another tab changed the mood: follow it.
  global.addEventListener("storage", function (e) {
    if (e.key === KEY && e.newValue) {
      root.setAttribute(ATTR, e.newValue);
      announce(e.newValue);
    }
  });

  global.UMTheme = {
    set: set,
    get: get,
    list: list,
    cycle: cycle,
    attribute: ATTR,
    storageKey: KEY,
  };
})(typeof window !== "undefined" ? window : this);
