// codegen.ts
import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema:
    process.env.ANTICAPTURE_GRAPHQL_ENDPOINT ||
    "../../apps/api-gateway/schema.graphql",
  documents: "./documents/**/*.graphql",
  ignoreNoDocuments: true,
  generates: {
    "./generated/hooks.ts": {
      plugins: [
        "typescript",
        "typescript-operations",
        "typescript-react-apollo",
      ],
      config: {
        dedupeFragments: true,
        avoidOptionals: true,
        strictScalars: true,
        scalars: {
          DateTime: "string",
          JSON: "string",
          URL: "string",
          NonNegativeInt: "number",
          PositiveInt: "number",
          ObjMap: "Record<string, unknown>",
          NonEmptyString: "string",
        },
      },
    },
  },
};

export default config;
