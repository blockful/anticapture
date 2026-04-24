import { createObservabilityProvider } from "@anticapture/observability";

import { env } from "@/env";

const observability = createObservabilityProvider("anticapture-indexer", {
  resourceAttributes: { dao: env.DAO_ID },
});

export const exporter = observability.exporter;
