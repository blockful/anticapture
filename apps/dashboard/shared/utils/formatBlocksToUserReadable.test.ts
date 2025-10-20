import { formatBlocksToUserReadable } from "@/shared/utils";

describe("formatBlocksToUserReadable", () => {
  // Test zero blocks
  test('returns "0 sec" for 0 blocks', () => {
    expect(formatBlocksToUserReadable(0, 12)).toBe("0 sec");
  });

  // Test small block counts (converted to seconds)
  test("converts 1 block to seconds", () => {
    expect(formatBlocksToUserReadable(1, 12)).toBe("12 secs");
  });

  test("converts 2 blocks to seconds", () => {
    expect(formatBlocksToUserReadable(2, 12)).toBe("24 secs");
  });

  test("converts 4 blocks to seconds", () => {
    expect(formatBlocksToUserReadable(4, 12)).toBe("48 secs");
  });

  // Test minutes
  test("formats 5 blocks as minutes", () => {
    expect(formatBlocksToUserReadable(5, 12)).toBe("1 min");
  });

  test("formats 10 blocks as minutes", () => {
    expect(formatBlocksToUserReadable(1, 120)).toBe("2 mins");
  });

  // Test hours
  test("formats 300 blocks as hours", () => {
    expect(formatBlocksToUserReadable(3, 1200)).toBe("1 hour");
  });

  test("formats 600 blocks as hours", () => {
    expect(formatBlocksToUserReadable(6, 1200)).toBe("2 hours");
  });

  // Test hours with remaining minutes
  test("formats blocks as hours and minutes", () => {
    expect(formatBlocksToUserReadable(3, 1205)).toBe("1 hour, 1 min");
  });

  // Edge cases
  test("handles fractional blocks correctly", () => {
    expect(formatBlocksToUserReadable(0, 12.5)).toBe("6 secs");
  });

  // Test that seconds are not shown when hours or minutes are present
  test("doesn't show seconds when hours or minutes are present", () => {
    expect(formatBlocksToUserReadable(6, 12)).toBe("1 min");
    expect(formatBlocksToUserReadable(3, 1201)).toBe("1 hour");
    expect(formatBlocksToUserReadable(3, 1205)).toBe("1 hour, 1 min");
  });
});
