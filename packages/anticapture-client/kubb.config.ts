import { fileURLToPath } from "node:url";

import { defineConfig } from "@kubb/core";
import { pluginClient } from "@kubb/plugin-client";
import { pluginFaker } from "@kubb/plugin-faker";
import { pluginMsw } from "@kubb/plugin-msw";
import { pluginOas } from "@kubb/plugin-oas";
import { pluginReactQuery } from "@kubb/plugin-react-query";
import { pluginTs } from "@kubb/plugin-ts";

const gatefulOpenApiSpecPath = fileURLToPath(
  new URL("../../apps/gateful/openapi/gateful.json", import.meta.url),
);

// The `GET /{dao}/dao` route has `operationId: "dao"` and a path parameter
// also named `dao`. Without this rename, Kubb emits `function dao(dao: ...)`,
// which is a duplicate-identifier error in TS.
const renameDaoOperation = (
  name: string,
  type?: "function" | "type" | "file" | "const",
) => (name === "dao" && type === "function" ? "getDao" : name);

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
        name: renameDaoOperation,
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
        name: renameDaoOperation,
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
    pluginFaker({
      output: {
        path: "mocks/faker.ts",
      },
      transformers: {
        name: renameDaoOperation,
      },
    }),
    pluginMsw({
      output: {
        path: "mocks.ts",
      },
      parser: "faker",
      handlers: true,
      transformers: {
        name: renameDaoOperation,
      },
    }),
  ],
}));
