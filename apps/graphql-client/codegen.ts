// codegen.ts
import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "./../api-gateway/schema.graphql",
  documents: "./documents/**/*.graphql",
  generates: {
    // Build with React hooks (for React apps)
    "./generated.ts": {
      plugins: [
        "typescript",
        "typescript-operations",
        "typescript-react-apollo",
      ],
    },
    // Build with just types and operations (for non-React usage)
    "./types.ts": {
      plugins: ["typescript", "typescript-operations"],
    },
  },
};

export default config;
