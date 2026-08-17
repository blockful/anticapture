import { describe, expect, it } from "vitest";

import { envSchema, loadDaoMap, parseDisabledDaos } from "./config";

describe("envSchema TOKEN_SERVICE_URL normalization", () => {
  it.each([
    ["http://authful:4002", "http://authful:4002"],
    ["http://authful:4002/", "http://authful:4002"],
    ["http://authful:4002///", "http://authful:4002"],
  ])("trims trailing slashes: %s -> %s", (input, expected) => {
    const parsed = envSchema.parse({
      TOKEN_SERVICE_URL: input,
      TOKEN_SERVICE_API_KEY: "internal-key",
      TOKEN_SERVICE_USAGE_API_KEY: "usage-key",
    });
    expect(parsed.TOKEN_SERVICE_URL).toBe(expected);
  });

  it("requires TOKEN_SERVICE_API_KEY when TOKEN_SERVICE_URL is set", () => {
    expect(() =>
      envSchema.parse({ TOKEN_SERVICE_URL: "http://authful:4002" }),
    ).toThrow();
  });

  it("requires TOKEN_SERVICE_USAGE_API_KEY when TOKEN_SERVICE_URL is set", () => {
    expect(() =>
      envSchema.parse({
        TOKEN_SERVICE_URL: "http://authful:4002",
        TOKEN_SERVICE_API_KEY: "internal-key",
      }),
    ).toThrow();
  });
});

describe("DISABLED_DAOS", () => {
  it("parses a comma-separated list case-insensitively", () => {
    expect(parseDisabledDaos(" SHU , torn ")).toEqual(new Set(["shu", "torn"]));
    expect(parseDisabledDaos(undefined)).toEqual(new Set());
    expect(parseDisabledDaos("")).toEqual(new Set());
  });

  it("drops disabled DAOs from the DAO map while keeping the rest", () => {
    const source = {
      DAO_API_ENS: "http://api-ens:42069",
      DAO_API_SHU: "http://api-shu:42069",
    };
    const map = loadDaoMap("DAO_API_", source, new Set(["shu"]));
    expect(map.get("ens")).toBe("http://api-ens:42069");
    expect(map.has("shu")).toBe(false);
  });

  it("keeps every registered DAO when nothing is disabled", () => {
    const source = { DAO_API_SHU: "http://api-shu:42069" };
    expect(loadDaoMap("DAO_API_", source).get("shu")).toBe(
      "http://api-shu:42069",
    );
  });

  it("ignores a disabled DAO's malformed URL instead of failing startup", () => {
    const source = {
      DAO_API_ENS: "http://api-ens:42069",
      DAO_API_SHU: "not a url",
    };
    const map = loadDaoMap("DAO_API_", source, new Set(["shu"]));
    expect(map.get("ens")).toBe("http://api-ens:42069");
    expect(map.has("shu")).toBe(false);
  });
});
