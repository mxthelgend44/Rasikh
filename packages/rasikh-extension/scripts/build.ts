// scripts/build.ts
import { build } from "vite";
import { cpSync } from "node:fs";

async function run() {
  const mode = process.argv.includes("--prod") ? "production" : "development";
  await build({ mode });
  // the content script is a separate self-contained file registered per granted origin
  await build({ mode, configFile: "vite.content.config.ts" });
  cpSync("icons", "dist/icons", { recursive: true });
  console.log(`Built ${mode} into dist`);
}
run();
