import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "es2022",
  outDir: "dist",
  clean: true,
  external: [
    /^[a-z]/i, // Bare imports like 'dotenv', 'hono'
    /^@[a-z]/i, // Scoped packages like '@hono/node-server'
  ],
});
