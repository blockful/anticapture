import { isDeepLinkSlug } from "@/shared/utils/deepLink";

import { REVENUE_ANCHORS } from "@/features/revenue/utils/anchors";

describe("REVENUE_ANCHORS", () => {
  const slugs = Object.values(REVENUE_ANCHORS);

  it("holds only valid slugs", () => {
    for (const slug of slugs) {
      expect({ slug, valid: isDeepLinkSlug(slug) }).toEqual({
        slug,
        valid: true,
      });
    }
  });

  it("gives every block its own slug", () => {
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  // Shared links depend on these exact strings. A failure here means a slug
  // was changed or removed: restore it, or links people already shared break.
  it("keeps the slugs that are already public", () => {
    expect(slugs).toEqual(
      expect.arrayContaining([
        "protocol-revenue",
        "run-rate",
        "revenue-by-stream",
        "registration-revenue",
        "renewal-revenue",
        "premium-revenue",
        "ensv2",
        "ensv2-revenue",
        "ensv2-names-migrated",
        "ensv2-registrations",
        "ensv2-daily-revenue",
        "ensv2-migration",
        "usage-and-adoption",
        "new-wallets",
        "renewal-rate",
        "revenue-by-period",
        "name-growth",
        "new-registrants",
        "upcoming-expirations",
        "renewal-rate-by-year",
      ]),
    );
  });
});
