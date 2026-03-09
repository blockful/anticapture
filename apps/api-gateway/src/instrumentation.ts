import { createObservabilityProvider } from "@anticapture/observability";

const observability = createObservabilityProvider("anticapture-gateway");

export const exporter = observability.exporter;
export const meterProvider = observability.meterProvider;
