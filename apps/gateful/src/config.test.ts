import { describe, expect, it } from "vitest";

import { envSchema } from "./config";

describe("envSchema TOKEN_SERVICE_URL normalization", () => {
  it.each([
    ["http://authful:4002", "http://authful:4002"],
    ["http://authful:4002/", "http://authful:4002"],
    ["http://authful:4002///", "http://authful:4002"],
  ])("trims trailing slashes: %s -> %s", (input, expected) => {
    const parsed = envSchema.parse({
      TOKEN_SERVICE_URL: input,
      TOKEN_SERVICE_API_KEY: "internal-key",
      TOKEN_SERVICE_PROVISIONING_API_KEY: "provisioning-key",
    });
    expect(parsed.TOKEN_SERVICE_URL).toBe(expected);
  });

  it("requires TOKEN_SERVICE_API_KEY when TOKEN_SERVICE_URL is set", () => {
    expect(() =>
      envSchema.parse({ TOKEN_SERVICE_URL: "http://authful:4002" }),
    ).toThrow();
  });

  it("requires TOKEN_SERVICE_PROVISIONING_API_KEY when TOKEN_SERVICE_URL is set", () => {
    expect(() =>
      envSchema.parse({
        TOKEN_SERVICE_URL: "http://authful:4002",
        TOKEN_SERVICE_API_KEY: "internal-key",
      }),
    ).toThrow();
  });
});
