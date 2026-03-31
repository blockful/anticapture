export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { createObservabilityProvider } =
      await import("@anticapture/observability");
    createObservabilityProvider("anticapture-dashboard");
  }
}
