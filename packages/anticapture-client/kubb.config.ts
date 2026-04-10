import { defineConfig } from "@kubb/core";
import { pluginClient } from "@kubb/plugin-client";
import { pluginOas } from "@kubb/plugin-oas";
import { pluginReactQuery } from "@kubb/plugin-react-query";
import { pluginTs } from "@kubb/plugin-ts";

export default defineConfig({
  input: {
    path: "https://gateful.up.railway.app/docs/json",
  },
  output: {
    path: "./generated",
    clean: true,
  },
  plugins: [
    pluginOas(),
    pluginTs({
      output: {
        path: "models.ts",
      },
    }),
    pluginClient({
      client: "fetch",
      output: {
        path: "sdk.ts",
      },
      transformers: {
        name: (name, type) =>
          name === "dao" && type === "function" ? "getDao" : name,
      },
    }),
    pluginReactQuery({
      output: {
        path: "hooks.ts",
      },
      client: {
        importPath: "../client",
      },
      exclude: [
        {
          type: "operationId",
          pattern: "dao",
        },
      ],
      mutation: false,
      transformers: {
        name: (name, type) =>
          name === "dao" && type === "function" ? "getDao" : name, // rename "dao" operation ID to getDao
      },
      suspense: {},
    }),
  ],
});
