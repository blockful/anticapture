import { fileURLToPath } from "node:url";

import { defineConfig } from "@kubb/core";
import { pluginClient } from "@kubb/plugin-client";
import { pluginOas } from "@kubb/plugin-oas";
import { pluginReactQuery } from "@kubb/plugin-react-query";
import { pluginTs } from "@kubb/plugin-ts";

const gatefulOpenApiSpecPath = fileURLToPath(
  new URL("../../apps/gateful/openapi/gateful.json", import.meta.url),
);

export default defineConfig(({ watch }) => ({
  input: {
    path: gatefulOpenApiSpecPath,
  },
  output: {
    path: "./generated",
    clean: !watch,
  },
  plugins: [
    pluginOas({
      collisionDetection: false,
    }),
    pluginTs({
      output: {
        path: "models.ts",
      },
    }),
    pluginClient({
      importPath: "../src/client",
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
        importPath: "../src/client",
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
      override: [
        {
          type: "tag",
          pattern: /skip-pagination/,
          options: {
            infinite: {
              initialPageParam: 0,
              queryParam: "skip",
            },
          },
        },
      ],
    }),
  ],
}));
