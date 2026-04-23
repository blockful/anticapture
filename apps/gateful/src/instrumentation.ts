import { createObservabilityProvider } from "@blockful/observability";

const observability = createObservabilityProvider("anticapture-gateful");

export const exporter = observability.exporter;
export const meterProvider = observability.meterProvider;
