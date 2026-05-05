import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    hooks: "src/hooks.ts",
    msw: "src/msw.ts",
  },
  format: ["esm"],
  target: "es2020",
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  external: ["@tanstack/react-query", "react", "msw", "@faker-js/faker"],
});
