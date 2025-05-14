import { formatBlocksToUserReadable } from "@/shared/utils/utils";

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

  // Test hours
  test("formats 300 blocks as hours", () => {
    expect(formatBlocksToUserReadable(300)).toBe("1 hour");
  });

  test("formats 600 blocks as hours", () => {
    expect(formatBlocksToUserReadable(600)).toBe("2 hours");
  });

  // Test hours with remaining minutes
  test("formats blocks as hours and minutes", () => {
    expect(formatBlocksToUserReadable(305)).toBe("1 hour, 1 min");
  });

  // Edge cases
  test("handles fractional blocks correctly", () => {
    expect(formatBlocksToUserReadable(0.5)).toBe("6 secs");
  });

  // Test that seconds are not shown when hours or minutes are present
  test("doesn't show seconds when hours or minutes are present", () => {
    expect(formatBlocksToUserReadable(6)).toBe("1 min");
    expect(formatBlocksToUserReadable(301)).toBe("1 hour");
    expect(formatBlocksToUserReadable(305)).toBe("1 hour, 1 min");
  });
});
