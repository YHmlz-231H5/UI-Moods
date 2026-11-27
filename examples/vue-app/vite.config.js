import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// A plain Vite + Vue 3 application. There is nothing special in here on
// purpose: the point of this example is that the library needs no plugin, no
// alias and no special configuration — it is consumed by the names its
// `exports` map declares, the way any other package would be.
//
//   import UM from "ui-moods/vue";
//   import "ui-moods/css/all.css";
//   import "ui-moods/themes/all.css";
//
// The one thing worth knowing is that `ui-moods/css/all.css` is the whole
// library in one file. A host that wants less imports `ui-moods/css/base.css`
// once and then one file per component:
//
//   import "ui-moods/css/base.css";
//   import "ui-moods/css/button.css";
//   import "ui-moods/css/input.css";
//
// The files are the same stylesheet, cut into pieces.

export default defineConfig({
  plugins: [vue()],
  build: {
    outDir: "dist",
    // The library is CSS and ES modules; there is nothing to minify by hand.
    cssMinify: true,
  },
});
