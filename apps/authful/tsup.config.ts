import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    // Emitted as its own file so it can be loaded via `node --import` before the
    // app graph (and therefore `pg`/`http`) evaluates — see package.json `start`.
    // Code splitting keeps the observability provider in a shared chunk, so the
    // `--import` instance and the one referenced by `/metrics` are the same.
    instrumentation: "src/instrumentation.ts",
  },
  format: ["esm"],
  target: "es2022",
  outDir: "dist",
  clean: true,
  splitting: true,
  external: [
    /^[a-z]/i, // Bare imports like 'dotenv', 'hono'
    /^@[a-z]/i, // Scoped packages like '@hono/node-server'
  ],
});
