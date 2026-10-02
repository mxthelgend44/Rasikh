import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts", "tests/safety/**/*.test.ts"],
    setupFiles: ["tests/setup.ts"]
  }
});
