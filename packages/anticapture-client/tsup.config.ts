import { defineConfig } from "tsup";
import type { Plugin } from "esbuild";

// The @modelcontextprotocol/sdk exports map uses bare paths (no `.js`),
// which Node refuses to resolve at runtime. Rewrite subpath imports to
// include the extension so the compiled output runs under plain `node`.
const mcpSdkExtensionFix: Plugin = {
  name: "mcp-sdk-extension-fix",
  setup(build) {
    build.onResolve({ filter: /^@modelcontextprotocol\/sdk\// }, (args) => {
      if (/\.[a-z]+$/i.test(args.path))
        return { path: args.path, external: true };
      return { path: `${args.path}.js`, external: true };
    });
  },
};

export default defineConfig([
  {
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
  },
  {
    entry: {
      "mcp-server": "mcp-server.ts",
      "mcp-server-http": "mcp-server-http.ts",
    },
    format: ["cjs"],
    target: "node20",
    platform: "node",
    sourcemap: true,
    clean: false,
    splitting: false,
    esbuildPlugins: [mcpSdkExtensionFix],
  },
]);
