import { defineConfig } from "@kubb/core";
import { pluginClient } from "@kubb/plugin-client";
import { pluginFaker } from "@kubb/plugin-faker";
import { pluginMsw } from "@kubb/plugin-msw";
import { pluginMcp } from "@kubb/plugin-mcp";
import { pluginOas } from "@kubb/plugin-oas";
import { pluginReactQuery } from "@kubb/plugin-react-query";
import { pluginTs } from "@kubb/plugin-ts";
import { pluginZod } from "@kubb/plugin-zod";

import {
  EthereumGenerator,
  generatedFormatTypes,
  mapEthereumFormatFakers,
  mapEthereumFormatTypes,
} from "./src/generators";
import { resolveGatefulOpenApiSpecUrl } from "./src/gateful-openapi-spec";

type PluginTsOptions = NonNullable<Parameters<typeof pluginTs>[0]>;
type PluginTsOptionsWithSchemaTransformer = Omit<
  PluginTsOptions,
  "transformers"
> & {
  transformers?: PluginTsOptions["transformers"] & {
    schema: typeof mapEthereumFormatTypes;
  };
};

// Codegen always generates from the live Gateful spec URL — never the local
// apps/gateful/openapi/gateful.json, which can be stale.
const gatefulOpenApiSpecPath = resolveGatefulOpenApiSpecUrl();

// The `GET /{dao}/dao` route has `operationId: "dao"` and a path parameter
// also named `dao`. Without this rename, Kubb emits `function dao(dao: ...)`,
// which is a duplicate-identifier error in TS.
const renameDaoOperation = (
  name: string,
  type?: "function" | "type" | "file" | "const",
) => (name === "dao" && type === "function" ? "getDao" : name);

const pluginTsOptions: PluginTsOptionsWithSchemaTransformer = {
  output: {
    path: "models.ts",
    banner: generatedFormatTypes,
  },
  transformers: {
    schema: mapEthereumFormatTypes,
  },
  generators: [EthereumGenerator],
};

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
    pluginTs(pluginTsOptions),
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
      group: {
        type: "tag",
        name: ({ group }) => `${group}Handlers`,
      },
      // exclude: [
      //   {
      //     type: "path",
      //     pattern: /.*relay.*/i,
      //   },
      //   {
      //     type: "path",
      //     pattern: /\/address-enrichment\/.*/i,
      //   },
      // ],
    }),
    pluginFaker({
      output: {
        path: "mocks/faker.ts",
      },
      transformers: {
        schema: mapEthereumFormatFakers,
        name: renameDaoOperation,
      },
    }),
    pluginMsw({
      output: {
        path: "mocks.ts",
      },
      parser: "faker",
      handlers: true,
      baseURL: "*",
      transformers: {
        name: renameDaoOperation,
      },
    }),
  ],
}));
