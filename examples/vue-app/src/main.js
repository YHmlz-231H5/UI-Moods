// A real Vue 3 application that consumes the ui-moods component library.
//
// The library is CSS plus plain ES modules, so there is no plugin to install
// and no build step to configure. Three imports and the components are there:
//
//   import UM from "ui-moods/vue";
//   import "ui-moods/css/all.css";
//   import "ui-moods/themes/all.css";
//
// The third one carries all 32 moods, so switching a mood is an attribute on
// the document and costs no network request at all.

import { createApp } from "vue";
import UM from "ui-moods/vue";

import "ui-moods/css/all.css";
import "ui-moods/themes/all.css";

import App from "./App.vue";

createApp(App).use(UM).mount("#app");
