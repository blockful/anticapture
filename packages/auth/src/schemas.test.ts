import { describe, expect, it } from "vitest";

import { AddressSchema, SiweVerifyBodySchema } from "./schemas.js";

describe("SiweVerifyBodySchema", () => {
  const validSignature = `0x${"a".repeat(130)}`;

  it("accepts a well-formed body", () => {
    const result = SiweVerifyBodySchema.safeParse({
      message: "hello",
      signature: validSignature,
    });
    expect(result.success).toBe(true);
  });

  it("rejects an oversized message", () => {
    const result = SiweVerifyBodySchema.safeParse({
      message: "x".repeat(4097),
      signature: validSignature,
    });
    expect(result.success).toBe(false);
  });

  it("rejects an oversized signature", () => {
    const result = SiweVerifyBodySchema.safeParse({
      message: "hello",
      signature: `0x${"a".repeat(3001)}`,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-hex signature", () => {
    const result = SiweVerifyBodySchema.safeParse({
      message: "hello",
      signature: "not-hex",
    });
    expect(result.success).toBe(false);
  });
});

describe("AddressSchema", () => {
  it("checksums a valid lowercase address", () => {
    const result = AddressSchema.parse(
      "0x1111111111111111111111111111111111111111",
    );
    expect(result).toBe("0x1111111111111111111111111111111111111111");
  });

  it("rejects an invalid address", () => {
    expect(() => AddressSchema.parse("0xnope")).toThrow();
  });
});
