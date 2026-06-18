import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const src = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@phantomdep/blocklist": src("./packages/blocklist/src/index.ts"),
      "@phantomdep/core": src("./packages/core/src/index.ts"),
    },
  },
  test: {
    globals: false,
    include: ["packages/**/src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["packages/**/src/**/*.ts"],
      exclude: ["packages/**/src/**/*.test.ts", "packages/**/src/**/index.ts"],
    },
  },
});
