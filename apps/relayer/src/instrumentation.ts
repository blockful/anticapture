import { createObservabilityProvider } from "@anticapture/observability";

import { env } from "@/env";

const observability = createObservabilityProvider("anticapture-relayer", {
  resourceAttributes: { dao: env.DAO_NAME },
});

export const exporter = observability.exporter;
export const meterProvider = observability.meterProvider;
