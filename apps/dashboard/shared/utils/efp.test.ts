import {
  formatEfpCounts,
  formatEfpDrawerStatsLabel,
  getEfpFollowNameClassName,
  getEfpProfileSlug,
  getEfpProfileUrl,
  shouldShowYouFollow,
} from "@/shared/utils/efp";

const address = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";

describe("efp", () => {
  describe("getEfpProfileSlug", () => {
    test("prefers ENS name", () => {
      expect(getEfpProfileSlug(address, "vitalik.eth")).toBe("vitalik.eth");
      expect(getEfpProfileSlug(address, null)).toBe(address);
    });
  });

  describe("getEfpProfileUrl", () => {
    test("builds efp.app profile link", () => {
      expect(getEfpProfileUrl(address, "nick.eth")).toBe(
        "https://efp.app/nick.eth",
      );
      expect(getEfpProfileUrl(address)).toBe(`https://efp.app/${address}`);
    });
  });

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

  describe("formatEfpDrawerStatsLabel", () => {
    test("formats combined drawer label with followers before following", () => {
      expect(
        formatEfpDrawerStatsLabel({ followersCount: 1597, followingCount: 0 }),
      ).toBe("1597 Followers · 0 Following");
      expect(
        formatEfpDrawerStatsLabel({ followersCount: 1, followingCount: 1 }),
      ).toBe("1 Follower · 1 Following");
    });
  });

  describe("getEfpFollowNameClassName", () => {
    test("returns default dashed border when not following", () => {
      expect(getEfpFollowNameClassName(false, true)).toContain(
        "border-border-contrast",
      );
      expect(getEfpFollowNameClassName(false, false)).toBeUndefined();
    });

    test("returns EFP yellow underline when following", () => {
      expect(getEfpFollowNameClassName(true, false)).toContain("#FFE067");
      expect(getEfpFollowNameClassName(true, true)).toContain("#FFE067");
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
