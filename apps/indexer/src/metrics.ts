import { createObservabilityProvider } from "@anticapture/observability";

const observability = createObservabilityProvider("anticapture-indexer");

export const exporter = observability.exporter;
