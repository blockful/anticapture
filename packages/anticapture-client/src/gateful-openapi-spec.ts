export type GatefulOpenApiSpecEnv = {
  ANTICAPTURE_API_URL?: string;
  RAILWAY_ENVIRONMENT_NAME?: string;
};

const GATEFUL_OPENAPI_PATH = "/docs/json";
const RAILWAY_GATEFUL_DOMAIN_SUFFIX = ".up.railway.app";

// Long-lived Railway environments serve Gateful from a stable, custom domain
// (e.g. dev-gateful.up.railway.app, gateful.up.railway.app) that does NOT follow
// the ephemeral `gateful-<env>` preview pattern. For those we trust the explicit
// ANTICAPTURE_API_URL; every other Railway environment is a PR preview whose
// Gateful domain we derive from the environment name.
const RAILWAY_DEPLOY_ENVIRONMENTS = new Set(["dev", "production"]);

const readNonEmptyValue = (value: string | undefined) => {
  const trimmed = value?.trim();

  return trimmed ? trimmed : undefined;
};

const trimTrailingSlashes = (url: string) => url.replace(/\/+$/, "");

// Some sources (e.g. Railway's ANTICAPTURE_API_URL) provide a bare host
// without a scheme. Default to https so the resulting URL is fetchable.
const toGatefulSpecUrl = (gatefulUrl: string) => {
  const base = trimTrailingSlashes(gatefulUrl);
  const withScheme = /^https?:\/\//i.test(base) ? base : `https://${base}`;

  return `${withScheme}${GATEFUL_OPENAPI_PATH}`;
};

// Railway names PR preview environments like `anticapture-pr-1950`, and Gateful's
// public domain in that environment is `gateful-anticapture-pr-1950.up.railway.app`
// — i.e. `gateful-<RAILWAY_ENVIRONMENT_NAME>`.
const buildPreviewGatefulSpecUrl = (railwayEnvironmentName: string) =>
  `https://gateful-${railwayEnvironmentName}${RAILWAY_GATEFUL_DOMAIN_SUFFIX}${GATEFUL_OPENAPI_PATH}`;

export const resolveGatefulOpenApiSpecUrl = (
  env: GatefulOpenApiSpecEnv = process.env,
) => {
  const railwayEnvironmentName = readNonEmptyValue(
    env.RAILWAY_ENVIRONMENT_NAME,
  );

  // PR preview environments interpolate their own Gateful domain and ignore
  // ANTICAPTURE_API_URL (which, on a preview, would point at the wrong host).
  if (
    railwayEnvironmentName &&
    !RAILWAY_DEPLOY_ENVIRONMENTS.has(railwayEnvironmentName)
  ) {
    return buildPreviewGatefulSpecUrl(railwayEnvironmentName);
  }

  // Explicit ANTICAPTURE_API_URL wins everywhere it is set: dev / production, CI,
  // and trusted Vercel previews (the workflow injects the PR-scoped URL via a
  // branch-scoped Vercel env / --build-env, mirrors apps/dashboard/next.config.ts).
  const gatefulUrl = readNonEmptyValue(env.ANTICAPTURE_API_URL);

  if (gatefulUrl) {
    return toGatefulSpecUrl(gatefulUrl);
  }

  // Untrusted/fork Vercel previews receive no ANTICAPTURE_API_URL and get no
  // Railway preview, so they can't reflect PR changes to the APIs/Gateful — we
  // don't support previewing them. They fall through to this throw.
  throw new Error(
    "Unable to resolve Gateful OpenAPI spec. Set ANTICAPTURE_API_URL (used on dev/production), or run inside a Railway PR preview with RAILWAY_ENVIRONMENT_NAME.",
  );
};
