// ui-moods · documentation site
//
// The site's own chrome, and nothing else. The components on the page come
// from the library; the theme comes from the theme sheet; this file only
// draws the picker and keeps it in step with the mood in force.
//
// The switching itself lives in `themes/switcher.js`, which is the same file
// a consumer of the library would use. The site uses the library the way the
// documentation says to.

(function () {
  "use strict";

  var themes = window.UM_THEMES || { light: [], dark: [] };
  var list = themes.light.concat(themes.dark);
  var root = document.documentElement;
  var picker = document.querySelector(".switcher__select");

  function isKnown(id) {
    return !!id && list.indexOf(id) !== -1;
  }

  /**
   * Put a mood in force.
   *
   * The shared switcher owns the attribute and the memory; this function
   * only keeps the picker in step with it. When the switcher is not on the
   * page — a host that rolled its own — the attribute is still set, because
   * the attribute is the whole mechanism.
   */
  function apply(id) {
    if (!isKnown(id)) return;
    if (window.UMTheme && window.UMTheme.set) {
      window.UMTheme.set(id);
    } else {
      root.setAttribute("data-um-theme", id);
      try {
        localStorage.setItem("um-theme", id);
      } catch (e) {
        /* private mode: the mood simply does not persist */
      }
    }
    if (picker) picker.value = id;
  }

  function build() {
    if (!picker) return;
    picker.innerHTML = "";
    var groups = [
      { id: "light", label: "Light · 浅色" },
      { id: "dark", label: "Dark · 深色" },
    ];
    for (var g = 0; g < groups.length; g++) {
      var ids = themes[groups[g].id] || [];
      if (!ids.length) continue;
      var group = document.createElement("optgroup");
      group.label = groups[g].label;
      for (var i = 0; i < ids.length; i++) {
        var option = document.createElement("option");
        option.value = ids[i];
        option.textContent = ids[i];
        group.appendChild(option);
      }
      picker.appendChild(group);
    }
    picker.addEventListener("change", function () {
      apply(picker.value);
    });
  }

  build();

  // The document is the source of truth, so the picker follows it. Anything
  // that changes the mood — this file, the shared switcher, another tab —
  // announces itself with the same event, and the picker catches up.
  root.addEventListener("um-theme-change", function (e) {
    if (picker && isKnown(e.detail && e.detail.theme)) {
      picker.value = e.detail.theme;
    }
  });

  // The shared switcher may already have named a mood — from `?theme=` or
  // from the last visit. Keep it when it names one that exists; otherwise
  // fall back to the default the theme sheet itself carries.
  var named = root.getAttribute("data-um-theme");
  apply(isKnown(named) ? named : window.UM_DEFAULT_THEME || list[0]);
})();
