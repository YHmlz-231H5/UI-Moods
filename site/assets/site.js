// ui-moods · documentation site
//
// The only JavaScript in the project, and it belongs to the documentation
// rather than to the library. The library itself is script-free: a component
// is markup plus classes, and a theme file decides what those classes look
// like.
//
// This file does two things: it fills the theme picker, and it remembers the
// chosen theme in localStorage so a page reload does not lose it.
//
// The theme <link> is written by the generator with the right relative path
// for the page's depth, so switching a theme only ever swaps the file name.

(function () {
  "use strict";

  var themes = window.UM_THEMES || { light: [], dark: [] };

  var stored = null;
  try {
    stored = localStorage.getItem("um-theme");
  } catch (e) {
    stored = null;
  }
  var fromUrl = new URLSearchParams(location.search).get("theme");
  var list = themes.light.concat(themes.dark);
  // The URL wins: it is an explicit instruction, and a link with `?theme=…`
  // should show what it says rather than whatever the last visit left behind.
  // The stored choice is the fallback for a plain visit.
  var current =
    fromUrl && list.indexOf(fromUrl) !== -1
      ? fromUrl
      : stored && list.indexOf(stored) !== -1
        ? stored
        : list[0] || "neon";

  var link = document.getElementById("um-theme");
  var picker = document.querySelector(".switcher__select");

  function apply(id) {
    if (!link || list.indexOf(id) === -1) return;
    link.setAttribute("href", link.getAttribute("href").replace(/\/[^/]+\.css$/, "/" + id + ".css"));
    document.documentElement.setAttribute("data-um-theme", id);
    try {
      localStorage.setItem("um-theme", id);
    } catch (e) {
      /* private mode: the theme simply does not persist */
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
    picker.value = current;
    picker.addEventListener("change", function () {
      apply(picker.value);
    });
  }

  build();
  apply(current);
})();
