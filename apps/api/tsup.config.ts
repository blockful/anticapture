import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "cmd/index.ts",
    aave: "cmd/aave.ts",
    instrumentation: "src/instrumentation.ts",
  },
  format: ["esm"],
  target: "es2022",
  outDir: "dist",
  clean: true,
  external: [
    /^[a-z]/i, // Bare imports like 'dotenv', 'hono'
    /^@[a-z]/i, // Scoped packages like '@hono/node-server'
  ],
});
