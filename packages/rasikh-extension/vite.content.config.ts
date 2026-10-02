// vite.content.config.ts
// Builds the content script as ONE self-contained classic script, dist/content.js. It is not in the
// manifest (no static content_scripts); sites.ts registers it per granted origin with
// chrome.scripting.registerContentScripts, which needs a plain file with no module imports.
// Runs after the main build, so it must not empty dist.
import { defineConfig } from "vite";

export default defineConfig({
  publicDir: false,
  build: {
    outDir: "dist",
    emptyOutDir: false,
    target: "es2022",
    sourcemap: false,
    lib: {
      entry: "src/content/index.ts",
      formats: ["iife"],
      name: "RasikhGuideContent",
      fileName: () => "content.js"
    }
  }
});
