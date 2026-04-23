import { createObservabilityProvider } from "@blockful/observability";

import { env } from "@/env";

const observability = createObservabilityProvider("anticapture-api", {
  resourceAttributes: { dao: env.DAO_ID },
});

export const exporter = observability.exporter;
export const meterProvider = observability.meterProvider;
