// codegen.ts
import type { CodegenConfig } from "@graphql-codegen/cli";

const PERMANENT_BRANCHES = ["dev", "main"];

const resolveSchema = () => {
  const prId = process.env.VERCEL_GIT_PULL_REQUEST_ID;
  const vercelEnv = process.env.VERCEL_ENV;
  const branch = process.env.VERCEL_GIT_COMMIT_REF;

  if (
    vercelEnv === "preview" &&
    prId &&
    !PERMANENT_BRANCHES.includes(branch ?? "")
  ) {
    return `https://api-gateway-anticapture-pr-${prId}.up.railway.app/graphql`;
  }

  return process.env.NEXT_PUBLIC_BASE_URL ?? "";
};

const config: CodegenConfig = {
  schema: resolveSchema(),
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
        avoidOptionals: true,
        dedupeFragments: true,
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
