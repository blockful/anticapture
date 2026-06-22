export type GatefulOpenApiSpecEnv = {
  NEXT_PUBLIC_GATEFUL_URL?: string;
  ANTICAPTURE_API_URL?: string;
  RAILWAY_SERVICE_GATEFUL_URL?: string;
  RAILWAY_ENVIRONMENT_NAME?: string;
  // Vercel hosts the dashboard's PR previews; these are its git-context vars.
  VERCEL_ENV?: string;
  VERCEL_GIT_PULL_REQUEST_ID?: string;
  VERCEL_GIT_COMMIT_REF?: string;
};

const GATEFUL_OPENAPI_PATH = "/docs/json";
const RAILWAY_GATEFUL_DOMAIN_SUFFIX = ".up.railway.app";

// Long-lived Railway environments serve Gateful from a stable, custom domain
// (e.g. dev-gateful.up.railway.app, gateful.up.railway.app) that does NOT follow
// the ephemeral `gateful-<env>` preview pattern. For those we trust the explicit
// NEXT_PUBLIC_GATEFUL_URL; every other Railway environment is a PR preview whose
// Gateful domain we derive from the environment name.
const RAILWAY_DEPLOY_ENVIRONMENTS = new Set(["dev", "production"]);

// On Vercel, preview deployments for the long-lived `dev`/`main` branches must
// keep using the configured Gateful URL instead of a per-PR preview host. Mirrors
// PERMANENT_BRANCHES in apps/dashboard/next.config.ts.
const VERCEL_PERMANENT_BRANCHES = new Set(["dev", "main"]);

const readNonEmptyValue = (value: string | undefined) => {
  const trimmed = value?.trim();

  return trimmed ? trimmed : undefined;
};

const trimTrailingSlashes = (url: string) => url.replace(/\/+$/, "");

// Some sources (e.g. Railway's RAILWAY_SERVICE_GATEFUL_URL) provide a bare host
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
  // NEXT_PUBLIC_GATEFUL_URL (which, on a preview, would point at the wrong host).
  if (
    railwayEnvironmentName &&
    !RAILWAY_DEPLOY_ENVIRONMENTS.has(railwayEnvironmentName)
  ) {
    return buildPreviewGatefulSpecUrl(railwayEnvironmentName);
  }

  // The dashboard's PR previews run on Vercel, where the Railway env vars above
  // are absent. Detect them via Vercel's own git vars and point codegen at the
  // PR's Gateful (Railway names that environment `anticapture-pr-<id>`), so the
  // generated client matches the PR's contract — not dev's. This mirrors
  // apps/dashboard/next.config.ts, which already does this for the runtime URL;
  // keep the two in sync. Without it, codegen falls through to the static dev
  // URL below and regenerates the client against the wrong contract on every
  // PR preview.
  const vercelPrId = readNonEmptyValue(env.VERCEL_GIT_PULL_REQUEST_ID);
  const vercelBranch = readNonEmptyValue(env.VERCEL_GIT_COMMIT_REF);
  if (
    readNonEmptyValue(env.VERCEL_ENV) === "preview" &&
    vercelPrId &&
    !VERCEL_PERMANENT_BRANCHES.has(vercelBranch ?? "")
  ) {
    return buildPreviewGatefulSpecUrl(`anticapture-pr-${vercelPrId}`);
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
    "Unable to resolve Gateful OpenAPI spec. Set NEXT_PUBLIC_GATEFUL_URL / ANTICAPTURE_API_URL / RAILWAY_SERVICE_GATEFUL_URL (used on dev/production), or run inside a Railway PR preview with RAILWAY_ENVIRONMENT_NAME, or a Vercel PR preview with VERCEL_ENV=preview and VERCEL_GIT_PULL_REQUEST_ID.",
  );
};
