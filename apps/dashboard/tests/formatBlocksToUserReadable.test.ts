import { formatBlocksToUserReadable } from "@/lib/client/utils";

describe("formatBlocksToUserReadable", () => {
  // Test zero blocks
  test('returns "0 sec" for 0 blocks', () => {
    expect(formatBlocksToUserReadable(0)).toBe("0 sec");
  });

  // Test small block counts (converted to seconds)
  test("converts 1 block to seconds", () => {
    expect(formatBlocksToUserReadable(1)).toBe("12 secs");
  });

  test("converts 2 blocks to seconds", () => {
    expect(formatBlocksToUserReadable(2)).toBe("24 secs");
  });

  test("converts 4 blocks to seconds", () => {
    expect(formatBlocksToUserReadable(4)).toBe("48 secs");
  });

  // Test minutes
  test("formats 5 blocks as minutes", () => {
    expect(formatBlocksToUserReadable(5)).toBe("1 min");
  });

  test("formats 10 blocks as minutes", () => {
    expect(formatBlocksToUserReadable(10)).toBe("2 mins");
  });

  // Test minutes with remaining seconds
  test("formats blocks as minutes and seconds", () => {
    expect(formatBlocksToUserReadable(6)).toBe("1 min, 12 secs");
  });

  // Test hours
  test("formats 300 blocks as hours", () => {
    expect(formatBlocksToUserReadable(300)).toBe("1 hour");
  });

  test("formats 600 blocks as hours", () => {
    expect(formatBlocksToUserReadable(600)).toBe("2 hours");
  });

  // Test hours with remaining minutes and seconds
  test("formats blocks as hours, minutes and seconds", () => {
    expect(formatBlocksToUserReadable(306)).toBe("1 hour, 1 min, 12 secs");
  });

  // Test days
  test("formats 7200 blocks as days", () => {
    expect(formatBlocksToUserReadable(7200)).toBe("1 day");
  });

  // Test weeks
  test("formats 50400 blocks as weeks", () => {
    expect(formatBlocksToUserReadable(50400)).toBe("1 week");
  });

  // Test months
  test("formats 216000 blocks as months", () => {
    expect(formatBlocksToUserReadable(216000)).toBe("1 month");
  });

  // Test years
  test("formats 2628000 blocks as years", () => {
    expect(formatBlocksToUserReadable(2628000)).toBe("1 year");
  });

  // Test complex combinations
  test("formats complex time combinations correctly", () => {
    expect(formatBlocksToUserReadable(2628000 + 216000 + 7200 + 300 + 6)).toBe(
      "1 year, 1 month, 1 day, 1 hour, 1 min, 12 secs",
    );
  });

  // Edge cases
  test("handles fractional blocks correctly", () => {
    expect(formatBlocksToUserReadable(0.5)).toBe("6 secs");
  });
});
