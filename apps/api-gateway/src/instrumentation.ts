import { createObservabilityProvider } from "@blockful/observability";

const observability = createObservabilityProvider("anticapture-gateway");

export const exporter = observability.exporter;
export const meterProvider = observability.meterProvider;
