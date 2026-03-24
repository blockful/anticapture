// codegen.ts
import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema:
    process.env.ANTICAPTURE_GRAPHQL_ENDPOINT ||
    "../../apps/api-gateway/schema.graphql",
  documents: "./documents/**/*.graphql",
  ignoreNoDocuments: true,
  generates: {
    // Build with React hooks (for React apps)
    "./generated/hooks.ts": {
      plugins: [
        "typescript",
        "typescript-operations",
        "typescript-react-apollo",
      ],
    },
    // Build with just types and operations (for non-React usage)
    "./generated/types.ts": {
      plugins: ["typescript", "typescript-operations"],
    },
  },
};

export default config;
