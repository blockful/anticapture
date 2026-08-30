import { shortHex } from "@/features/decoder/utils/shortHex";

describe("shortHex", () => {
  test("middle-truncates long hex", () => {
    const address = "0x26D5EB37002152186ec86B9835ecAf32846bC0DD";
    expect(shortHex(address)).toBe("0x26D5EB37…846bC0DD");
  });

  test("short values pass through", () => {
    expect(shortHex("0xa9059cbb")).toBe("0xa9059cbb");
    expect(shortHex("12345")).toBe("12345");
  });

  test("boundary length is untouched", () => {
    const value = "a".repeat(19);
    expect(shortHex(value)).toBe(value);
  });
});
