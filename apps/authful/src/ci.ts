/**
 * Detects a Railway PR preview ("CI") environment, mirroring the API's
 * `apps/api/cmd/ci.ts`. Railway sets RAILWAY_ENVIRONMENT_NAME per environment;
 * anything that isn't `dev` or `production` is a transient preview deploy.
 */
export function isRailwayPreviewEnv(): boolean {
  return !["dev", "production"].includes(
    // HACK: coupled to the Railway environment for now as we have no way to avoid it
    process.env["RAILWAY_ENVIRONMENT_NAME"] || "dev",
  );
}
