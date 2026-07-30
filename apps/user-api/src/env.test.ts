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
  it.each([
    ["missing", undefined],
    ["blank", ""],
  ])(
    "rejects Authful provisioning with a %s metrics token",
    (_case, metricsToken) => {
      const result = envSchema.safeParse({
        ...BASE_ENV,
        USER_API_METRICS_TOKEN: metricsToken,
      });

      if (result.success) {
        throw new Error("expected environment validation to fail");
      }
      expect(result.error.issues).toEqual([
        {
          code: "custom",
          path: ["USER_API_METRICS_TOKEN"],
          message:
            "USER_API_METRICS_TOKEN is required when Authful provisioning is enabled",
        },
      ]);
    },
  );

  it("accepts Authful provisioning with protected metrics", () => {
    const result = envSchema.safeParse({
      ...BASE_ENV,
      USER_API_METRICS_TOKEN: "metrics-test-token",
    });

    expect(result.success).toBe(true);
  });
});
