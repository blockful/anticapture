import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/*.test.ts",
        "src/**/*.d.ts",
        "src/clients/*/abi/**",
        "src/database/schema.ts",
        "src/database/offchain-schema.ts",
        "src/**/*.interface.ts",
        "src/**/types.ts",
        "src/env.ts",
        "src/docs.ts",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"), // Ensure we can import from the src directory
    },
  },
});
