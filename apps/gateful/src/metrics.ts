import { meterProvider } from "./instrumentation.js";

const meter = meterProvider.getMeter("anticapture-gateful");

export const cacheRequestTotal = meter.createCounter("cache_requests_total", {
  description:
    "Total number of cache lookups, labelled by result (hit/miss) and route",
});
