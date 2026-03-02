import * as Sentry from "@sentry/nextjs";
import axios from "axios";

/**
 * Registers an axios request interceptor that injects Sentry trace headers
 * (`sentry-trace` and `baggage`) into every outgoing request.
 *
 * This is necessary because @sentry/nextjs only auto-instruments native fetch,
 * not axios. Without this, axios requests will not be linked to the active trace.
 */
export function registerSentryAxiosTracing() {
  axios.interceptors.request.use((config) => {
    const span = Sentry.getActiveSpan();
    if (span) {
      const sentryTrace = Sentry.spanToTraceHeader(span);
      const baggage = Sentry.spanToBaggageHeader(span);
      config.headers["sentry-trace"] = sentryTrace;
      if (baggage) {
        config.headers["baggage"] = baggage;
      }
    }
    return config;
  });
}
