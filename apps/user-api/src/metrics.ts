import { meterProvider } from "./instrumentation.js";

const meter = meterProvider.getMeter("anticapture-user-api");

export const authCeremonyTotal = meter.createCounter(
  "user_api_auth_ceremony_total",
  {
    description:
      "Authentication ceremonies, labelled by method (siwe|google|magic-link) and result",
  },
);

export const httpRequestDuration = meter.createHistogram(
  "http_server_request_duration_seconds",
  {
    description: "Duration of HTTP requests in seconds",
    advice: {
      explicitBucketBoundaries: [
        0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10,
      ],
    },
  },
);
