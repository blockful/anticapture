import { defineConfig } from "tsup";

const shared = {
  entry: ["src/index.ts", "src/fastify.ts"],
  dts: true,
  outDir: "dist",
  // Bundle all OTel packages to avoid ESM/CJS resolution issues in consumers
  // like ponder. Keep @opentelemetry/api external so it remains a singleton.
  noExternal: [/^@opentelemetry\/(?!api$)/],
  external: ["@opentelemetry/api"],
} as const;

export default defineConfig([
  {
    ...shared,
    format: ["esm"],
    // The bundled OTel CJS packages use require() internally. Provide a shim
    // so the ESM output can resolve those calls at runtime.
    banner: {
      js: 'import { createRequire } from "module"; const require = createRequire(import.meta.url);',
    },
  },
  {
    ...shared,
    format: ["cjs"],
    dts: false, // only emit .d.ts once from the ESM build
    // Share the bundled OTel code between the two entries instead of
    // duplicating it in fastify.cjs.
    splitting: true,
  },
]);
