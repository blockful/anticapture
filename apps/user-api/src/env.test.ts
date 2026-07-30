import { describe, expect, it } from "vitest";

import { envSchema } from "@/env-schema";

const BASE_ENV = {
  DATABASE_URL: "postgres://localhost:5432/anticapture",
  BETTER_AUTH_SECRET: "integration-test-secret-0123456789abcdef",
  AUTH_SIWE_DOMAINS: "localhost:3000",
  RPC_URL: "https://rpc.example.com",
  AUTHFUL_URL: "https://authful.example.com",
  AUTHFUL_PROVISIONING_API_KEY: "provisioning-test-key",
};

describe("user API environment", () => {
  // The metrics token gates /metrics and the per-user gauges at wiring time
  // (index.ts), not at boot: an environment provisioned before the token
  // existed must still start, just without the validation dashboard.
  it.each([
    ["missing", undefined],
    ["blank", ""],
  ])("boots Authful provisioning with a %s metrics token", (_case, token) => {
    const result = envSchema.safeParse({
      ...BASE_ENV,
      USER_API_METRICS_TOKEN: token,
    });

    expect(result.success).toBe(true);
  });

  it("accepts Authful provisioning with protected metrics", () => {
    const result = envSchema.safeParse({
      ...BASE_ENV,
      USER_API_METRICS_TOKEN: "metrics-test-token",
    });

    expect(result.success).toBe(true);
  });
});
