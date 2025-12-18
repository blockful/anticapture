import { defineConfig } from "orval";

export default defineConfig({
  indexer: {
    input: {
      // OpenAPI spec - use local file for now, or URL when indexer is running
      target:
        process.env.INDEXER_OPENAPI_URL || "./shared/api/openapi-dao.json",
    },
    output: {
      // Generate React Query hooks
      mode: "tags-split",
      target: "./shared/api/generated/indexer.ts",
      schemas: "./shared/api/generated/schemas",
      client: "react-query",
      // Override to use custom mutator
      override: {
        mutator: {
          path: "./shared/api/mutator.ts",
          name: "customInstance",
        },
        query: {
          useQuery: true,
          useInfinite: false,
          useInfiniteQueryParam: "limit",
        },
      },
    },
  },
});
