import { defineConfig } from "@playwright/test";

// Real-browser end-to-end suite for the Rasikh extension. It loads the BUILT unpacked extension (dist/)
// into Chromium and walks the three local MOCK portals. Run it with one command: npm run e2e:run
// (starts the backend on 8796 and the portals on 8793 if they are not up, runs this suite, stops what it started).
export default defineConfig({
  testDir: ".",
  testMatch: "rasikh-*.spec.ts",
  timeout: 120_000,
  expect: { timeout: 8_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"], ["json", { outputFile: "../../test-results/e2e-results.json" }]],
  outputDir: "../../test-results/e2e-artifacts"
});
