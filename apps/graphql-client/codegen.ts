// codegen.ts
import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "./../api-gateway/schema.graphql",
  documents: "./documents/**/*.graphql",
  generates: {
    "./generated.ts": {
      plugins: ["typescript", "typescript-operations"],
    },
  },
};

export default config;
