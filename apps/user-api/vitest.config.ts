import path from "path";

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    // Integration suites push the full Drizzle schema to a fresh PGlite
    // instance in beforeAll (drizzle-kit's pushSchema does a real DB
    // introspection + diff). That takes several seconds and, under CI's
    // constrained cores with test files running in parallel, overruns
    // vitest's default 10s hook timeout. Give the setup/teardown hooks
    // and the SIWE-signing tests generous headroom.
    hookTimeout: 30_000,
    testTimeout: 30_000,
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
});
