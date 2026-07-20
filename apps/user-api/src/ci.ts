/**
 * Detects a Railway PR preview ("CI") environment, mirroring
 * `apps/authful/src/ci.ts`. Railway sets RAILWAY_ENVIRONMENT_NAME per
 * environment; anything that isn't `dev` or `production` is a transient
 * preview deploy. Local runs (no Railway env) count as `dev` — preview-only
 * affordances never activate on a developer machine.
 */
export function isRailwayPreviewEnv(): boolean {
  return !["dev", "production"].includes(
    process.env["RAILWAY_ENVIRONMENT_NAME"] || "dev",
  );
}
