import path from "path";

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
      "@anticapture/observability": path.resolve(
        import.meta.dirname,
        "../../packages/observability/src/index.ts",
      ),
    },
  },
});
