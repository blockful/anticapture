import { permalinkAddress } from "@/features/decoder/utils/addressInput";

const ADDRESS = "0x26D5EB37002152186ec86B9835ecAf32846bC0DD";

describe("permalinkAddress", () => {
  test("keeps a complete address, checksummed or not", () => {
    expect(permalinkAddress(ADDRESS)).toBe(ADDRESS);
    expect(permalinkAddress(ADDRESS.toLowerCase())).toBe(ADDRESS.toLowerCase());
  });

  test("trims the surrounding whitespace of a paste", () => {
    expect(permalinkAddress(`  ${ADDRESS}\n`)).toBe(ADDRESS);
  });

  test("drops anything that is not an address", () => {
    // A half-typed address would otherwise reach the URL on every keystroke.
    expect(permalinkAddress("0x26D5EB")).toBe("");
    expect(permalinkAddress("vitalik.eth")).toBe("");
    expect(permalinkAddress("")).toBe("");
    expect(permalinkAddress(`${ADDRESS}00`)).toBe("");
    expect(permalinkAddress(ADDRESS.slice(0, -1))).toBe("");
    // Mixed case must match its checksum, the same rule the field applies.
    expect(permalinkAddress(ADDRESS.replace("0x26D5", "0x26d5"))).toBe("");
    expect(permalinkAddress("x".repeat(5_000))).toBe("");
  });
});
