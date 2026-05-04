export function isRailwayPreviewEnv(): boolean {
  // HACK: This will remain coupled to the raiwlay environment for now as we have no way to avoid it
  return !["dev", "production"].includes(
    process.env.RAILWAY_ENVIRONMENT_NAME || "dev",
  );
}
