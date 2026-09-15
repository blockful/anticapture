import {
  clampCalldataInput,
  exceedsPermalinkLimit,
  isValidCalldataInput,
  MAX_CALLDATA_INPUT_CHARS,
  normalizeCalldataInput,
  PERMALINK_CALLDATA_LIMIT,
} from "@/features/decoder/utils/calldataInput";

describe("normalizeCalldataInput", () => {
  test("strips whitespace and newlines from explorer pastes", () => {
    expect(normalizeCalldataInput("0xa905\n9cbb 0000\t11")).toBe(
      "0xa9059cbb000011",
    );
  });

  test("leaves clean input untouched", () => {
    expect(normalizeCalldataInput("0xa9059cbb")).toBe("0xa9059cbb");
  });
});

describe("isValidCalldataInput", () => {
  test("accepts 0x-prefixed even-length hex", () => {
    expect(isValidCalldataInput("0xa9059cbb")).toBe(true);
    expect(isValidCalldataInput("0x")).toBe(true);
  });

  test("rejects odd length, missing prefix and non-hex", () => {
    expect(isValidCalldataInput("0xa9059cb")).toBe(false);
    expect(isValidCalldataInput("a9059cbb")).toBe(false);
    expect(isValidCalldataInput("0xzz")).toBe(false);
  });
});

describe("input bounds", () => {
  test("a paste is clamped to what the decoder would ever look at", () => {
    const huge = `0x${"ab".repeat(400_000)}`;
    expect(huge.length).toBeGreaterThan(MAX_CALLDATA_INPUT_CHARS);
    expect(clampCalldataInput(huge)).toHaveLength(MAX_CALLDATA_INPUT_CHARS);
    // Anything that fits is returned untouched, not copied through a slice.
    const small = "0xabcd";
    expect(clampCalldataInput(small)).toBe(small);
  });

  test("the permalink limit counts the encoded length, not the raw one", () => {
    expect(exceedsPermalinkLimit("0xabcd")).toBe(false);
    // Whitespace costs three characters each once encoded, so an input under
    // the raw limit can still be over it.
    const spaced = " ".repeat(PERMALINK_CALLDATA_LIMIT - 1);
    expect(spaced.length).toBeLessThan(PERMALINK_CALLDATA_LIMIT);
    expect(exceedsPermalinkLimit(spaced)).toBe(true);
    expect(
      exceedsPermalinkLimit("a".repeat(PERMALINK_CALLDATA_LIMIT + 1)),
    ).toBe(true);
  });
});
