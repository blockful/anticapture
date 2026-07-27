import { meterProvider } from "@/instrumentation";
import { AGE_BUCKETS, type MetricsSnapshotService } from "@/services/metrics";

const meter = meterProvider.getMeter("anticapture-user-api");

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

// Monotonic: incremented once per successful key creation. Deriving this from
// a live row count would decrement when a user account is deleted (the
// userApiKeys FK cascades), which Prometheus reads as a counter reset and turns
// into a false spike in increase(user_api_keys_created_total[1d]).
export const keysCreatedTotal = meter.createCounter(
  "user_api_keys_created_total",
  { description: "Total user API keys created" },
);

export const registerValidationMetrics = (
  service: MetricsSnapshotService,
): void => {
  meter
    .createObservableGauge("user_api_accounts_total", {
      description: "Total registered user accounts",
    })
    .addCallback((result) => result.observe(service.snapshot().accountsTotal));
  meter
    .createObservableGauge("user_api_keys_live", {
      description: "Current non-revoked user API keys",
    })
    .addCallback((result) => result.observe(service.snapshot().keysLive));
  meter
    .createObservableGauge("user_api_active_users", {
      description: "Today's active users bucketed by newest key age",
    })
    .addCallback((result) => {
      const { activeUsers } = service.snapshot();
      for (const bucket of AGE_BUCKETS) {
        result.observe(activeUsers[bucket], { age_bucket: bucket });
      }
    });
  meter
    .createObservableGauge("user_api_user_tokens", {
      description: "Current live API keys by user identifier and login method",
    })
    .addCallback((result) => {
      for (const userMetrics of service.snapshot().users) {
        result.observe(userMetrics.tokens, {
          identifier: userMetrics.identifier,
          login_method: userMetrics.loginMethod,
        });
      }
    });
  meter
    .createObservableGauge("user_api_user_usage_today", {
      description: "Today's API requests by user identifier and login method",
    })
    .addCallback((result) => {
      for (const userMetrics of service.snapshot().users) {
        result.observe(userMetrics.usage, {
          identifier: userMetrics.identifier,
          login_method: userMetrics.loginMethod,
        });
      }
    });
};
