import { existsSync } from "node:fs";
import { resolve } from "node:path";

type FileExists = (path: string) => boolean;

export type GatefulOpenApiSpecEnv = {
  NEXT_PUBLIC_GATEFUL_URL?: string;
  RAILWAY_ENVIRONMENT_NAME?: string;
};

type ResolveGatefulOpenApiSpecOptions = {
  env?: GatefulOpenApiSpecEnv;
  fileExists?: FileExists;
  packageDirectory: string;
};

const GATEFUL_OPENAPI_PATH = "/docs/json";
const RAILWAY_GATEFUL_DOMAIN_SUFFIX = ".up.railway.app";

const readNonEmptyValue = (value: string | undefined) => {
  const trimmed = value?.trim();

  return trimmed ? trimmed : undefined;
};

const trimTrailingSlashes = (url: string) => url.replace(/\/+$/, "");

export const resolveLocalGatefulOpenApiSpec = (packageDirectory: string) =>
  resolve(packageDirectory, "../../apps/gateful/openapi/gateful.json");

export const resolveGatefulOpenApiSpecUrl = (
  env: GatefulOpenApiSpecEnv = process.env,
) => {
  const gatefulUrl = readNonEmptyValue(env.NEXT_PUBLIC_GATEFUL_URL);

  if (gatefulUrl) {
    return `${trimTrailingSlashes(gatefulUrl)}${GATEFUL_OPENAPI_PATH}`;
  }

  const railwayEnvironmentName = readNonEmptyValue(
    env.RAILWAY_ENVIRONMENT_NAME,
  );

  if (railwayEnvironmentName) {
    return `https://gateful-anticapture-${railwayEnvironmentName}${RAILWAY_GATEFUL_DOMAIN_SUFFIX}${GATEFUL_OPENAPI_PATH}`;
  }

  throw new Error(
    "Unable to resolve Gateful OpenAPI spec. Generate apps/gateful/openapi/gateful.json, set NEXT_PUBLIC_GATEFUL_URL, or run codegen inside Railway with RAILWAY_ENVIRONMENT_NAME.",
  );
};

// Prefer the local spec file when it exists, otherwise fall back to a remote
// spec URL so CI and Railway preview builds can still generate the client.
export const resolveGatefulOpenApiSpec = ({
  env = process.env,
  fileExists = existsSync,
  packageDirectory,
}: ResolveGatefulOpenApiSpecOptions) => {
  const localSpec = resolveLocalGatefulOpenApiSpec(packageDirectory);

  return fileExists(localSpec) ? localSpec : resolveGatefulOpenApiSpecUrl(env);
};
