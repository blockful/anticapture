// Resolves the Gateful OpenAPI spec URL from the docs build environment.
//
// This is a deliberate inline copy of the resolver in
// packages/anticapture-client/src/gateful-openapi-spec.ts. The docs build runs
// in a `turbo prune @anticapture/client-docs` image that does NOT include the
// sibling @anticapture/client package, so importing across the package boundary
// breaks in Docker. The docs service is given the same Railway env vars, so it
// resolves the URL from its own environment instead.
//
// KEEP IN SYNC with packages/anticapture-client/src/gateful-openapi-spec.ts.

const GATEFUL_OPENAPI_PATH = "/docs/json";
const RAILWAY_GATEFUL_DOMAIN_SUFFIX = ".up.railway.app";

// Long-lived Railway environments serve Gateful from a stable, custom domain
// (e.g. dev-gateful.up.railway.app, gateful.up.railway.app) that does NOT follow
// the ephemeral `gateful-<env>` preview pattern. For those we trust the explicit
// NEXT_PUBLIC_GATEFUL_URL; every other Railway environment is a PR preview whose
// Gateful domain we derive from the environment name.
const RAILWAY_DEPLOY_ENVIRONMENTS = new Set(["dev", "production"]);

const readNonEmptyValue = (value) => {
  const trimmed = value?.trim();

  return trimmed ? trimmed : undefined;
};

const trimTrailingSlashes = (url) => url.replace(/\/+$/, "");

// Some sources (e.g. Railway's RAILWAY_SERVICE_GATEFUL_URL) provide a bare host
// without a scheme. Default to https so the resulting URL is fetchable.
const toGatefulSpecUrl = (gatefulUrl) => {
  const base = trimTrailingSlashes(gatefulUrl);
  const withScheme = /^https?:\/\//i.test(base) ? base : `https://${base}`;

  return `${withScheme}${GATEFUL_OPENAPI_PATH}`;
};

// Railway names PR preview environments like `anticapture-pr-1950`, and Gateful's
// public domain in that environment is `gateful-anticapture-pr-1950.up.railway.app`
// — i.e. `gateful-<RAILWAY_ENVIRONMENT_NAME>`.
const buildPreviewGatefulSpecUrl = (railwayEnvironmentName) =>
  `https://gateful-${railwayEnvironmentName}${RAILWAY_GATEFUL_DOMAIN_SUFFIX}${GATEFUL_OPENAPI_PATH}`;

export const resolveGatefulOpenApiSpecUrl = (env = process.env) => {
  const railwayEnvironmentName = readNonEmptyValue(env.RAILWAY_ENVIRONMENT_NAME);

  // PR preview environments interpolate their own Gateful domain and ignore
  // NEXT_PUBLIC_GATEFUL_URL (which, on a preview, would point at the wrong host).
  if (
    railwayEnvironmentName &&
    !RAILWAY_DEPLOY_ENVIRONMENTS.has(railwayEnvironmentName)
  ) {
    return buildPreviewGatefulSpecUrl(railwayEnvironmentName);
  }

  // dev / production (and CI) read the Gateful URL from the environment. Sources,
  // in priority order:
  //   1. NEXT_PUBLIC_GATEFUL_URL    — set explicitly in CI and local dev.
  //   2. ANTICAPTURE_API_URL        — already present on the mcp-server service.
  //   3. RAILWAY_SERVICE_GATEFUL_URL — Railway-provided reference (bare host),
  //                                    available on services like docs that lack
  //                                    the two above.
  const gatefulUrl =
    readNonEmptyValue(env.NEXT_PUBLIC_GATEFUL_URL) ??
    readNonEmptyValue(env.ANTICAPTURE_API_URL) ??
    readNonEmptyValue(env.RAILWAY_SERVICE_GATEFUL_URL);

  if (gatefulUrl) {
    return toGatefulSpecUrl(gatefulUrl);
  }

  throw new Error(
    "Unable to resolve Gateful OpenAPI spec. Set NEXT_PUBLIC_GATEFUL_URL / ANTICAPTURE_API_URL / RAILWAY_SERVICE_GATEFUL_URL (used on dev/production), or run inside a Railway PR preview with RAILWAY_ENVIRONMENT_NAME.",
  );
};
