import { defineConfig } from "@kubb/core";
import { pluginOas } from "@kubb/plugin-oas";
import { pluginTs } from "@kubb/plugin-ts";
import { pluginReactQuery } from "@kubb/plugin-react-query";
import { pluginClient } from "@kubb/plugin-client";
import { pluginZod } from "@kubb/plugin-zod";

export default defineConfig(() => {
  return {
    root: ".",
    input: {
      path: "https://obol-api-dev.up.railway.app/docs",
    },
    output: {
      path: "./src/gen",
      clean: true,
    },
    plugins: [
      pluginOas({
        output: {
          path: "./models",
        },
      }),
      pluginTs({
        output: {
          path: "./types",
        },
      }),
      pluginReactQuery({
        output: {
          path: "./hooks",
        },
        group: {
          type: "tag",
          name: ({ group }) => `${group}Hooks`,
        },
        client: {
          dataReturnType: "full",
        },
        mutation: {
          methods: ["post", "put", "delete"],
        },
        infinite: {
          queryParam: "next_page",
          initialPageParam: 0,
          nextParam: "pagination.next.cursor",
          previousParam: ["pagination", "prev", "cursor"],
        },
        query: {
          methods: ["get"],
          importPath: "@tanstack/react-query",
        },
        suspense: {},
      }),
      pluginClient({
        output: {
          path: "./clients/axios",
          barrelType: "named",
          banner: "/* eslint-disable no-alert, no-console */",
          footer: "",
        },
        group: {
          type: "tag",
          name: ({ group }) => `${group}Service`,
        },
        transformers: {
          name: (name, type) => {
            return `${name}Client`;
          },
        },
        operations: true,
        parser: "client",
        exclude: [
          {
            type: "tag",
            pattern: "store",
          },
        ],
        pathParamsType: "object",
        dataReturnType: "full",
        client: "axios",
      }),
    ],
  };
});
