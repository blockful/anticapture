import {
  formatEfpCounts,
  formatEfpIdentityLabel,
  shouldShowYouFollow,
} from "@/shared/utils/formatEfp";

describe("formatEfp", () => {
  describe("formatEfpCounts", () => {
    test("returns null for missing stats", () => {
      expect(formatEfpCounts(null)).toBeNull();
    });

    test("formats zero counts", () => {
      expect(formatEfpCounts({ followersCount: 0, followingCount: 0 })).toBe(
        "0 followers · 0 following",
      );
    });

    test("formats singular counts", () => {
      expect(formatEfpCounts({ followersCount: 1, followingCount: 1 })).toBe(
        "1 follower · 1 following",
      );
    });

    test("formats plural counts", () => {
      expect(
        formatEfpCounts({ followersCount: 5396, followingCount: 10 }),
      ).toBe("5396 followers · 10 following");
    });
  });

  describe("formatEfpIdentityLabel", () => {
    test("returns identity framing copy", () => {
      expect(formatEfpIdentityLabel()).toBe(
        "EFP social graph — identity context, not a risk signal.",
      );
    });
  });

  describe("shouldShowYouFollow", () => {
    test("returns true only when following without block or mute", () => {
      expect(
        shouldShowYouFollow({ follow: true, block: false, mute: false }),
      ).toBe(true);
      expect(
        shouldShowYouFollow({ follow: true, block: true, mute: false }),
      ).toBe(false);
      expect(
        shouldShowYouFollow({ follow: true, block: false, mute: true }),
      ).toBe(false);
      expect(
        shouldShowYouFollow({ follow: false, block: false, mute: false }),
      ).toBe(false);
      expect(shouldShowYouFollow(null)).toBe(false);
    });
  });
});
