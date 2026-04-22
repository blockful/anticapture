import { defineConfig } from "tsup";

export default defineConfig({
  entry: { index: "src/index.ts", instrumentation: "src/instrumentation.ts" },
  format: ["esm"],
  target: "es2022",
  outDir: "dist",
  clean: true,
  external: [/^[a-z]/i, /^@[a-z]/i],
});
