// codegen.ts
import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "../../apps/api-gateway/schema.graphql",
  documents: "./documents/**/*.graphql",
  generates: {
    // Build with React hooks (for React apps)
    "src/react/index.ts": {
      plugins: [
        "typescript",
        "typescript-operations",
        "typescript-react-apollo",
      ],
    },
  },
};

export default config;
