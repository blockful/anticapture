import { fileURLToPath } from "node:url";

import { defineConfig } from "@kubb/core";
import { pluginClient } from "@kubb/plugin-client";
import { pluginOas } from "@kubb/plugin-oas";
import { pluginReactQuery } from "@kubb/plugin-react-query";
import { pluginTs } from "@kubb/plugin-ts";
import { pluginMcp } from "@kubb/plugin-mcp";
import { pluginZod } from "@kubb/plugin-zod";

const gatefulOpenApiSpecPath = fileURLToPath(
  new URL("../../apps/gateful/openapi/gateful.json", import.meta.url),
);

export default defineConfig(({ watch }) => ({
  input: {
    path: gatefulOpenApiSpecPath,
  },
  output: {
    clean: !watch,
    path: "./generated",
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
              queryParam: "skip",
              initialPageParam: 0,
            },
          },
        },
      ],
    }),
    pluginZod({
      output: {
        path: "zod.ts",
      },
    }),
    pluginMcp({
      output: {
        path: "./mcp",
        barrelType: "named",
      },
      client: {
        baseURL: "http://localhost:4001",
      },
      group: {
        type: "tag",
        name: ({ group }) => `${group}Handlers`,
      },
    }),
  ],
}));
