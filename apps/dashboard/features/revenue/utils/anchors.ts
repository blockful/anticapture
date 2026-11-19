/**
 * Deep-link slugs of the revenue page: `/ens/revenue#<slug>` opens the page
 * at that block. One per titled block, in page order.
 *
 * These are public: people share them. Rename a title freely, but do not
 * change or reuse a slug.
 */
export const REVENUE_ANCHORS = {
  // Revenue summary
  protocolRevenue: "protocol-revenue",
  runRate: "run-rate",

  // All time revenue
  revenueByStream: "revenue-by-stream",

  // Stream breakdown
  registrationRevenue: "registration-revenue",
  renewalRevenue: "renewal-revenue",
  premiumRevenue: "premium-revenue",

  // ENSv2
  ensv2: "ensv2",
  ensv2Revenue: "ensv2-revenue",
  ensv2NamesMigrated: "ensv2-names-migrated",
  ensv2Registrations: "ensv2-registrations",
  ensv2DailyRevenue: "ensv2-daily-revenue",
  ensv2Migration: "ensv2-migration",

  // Usage & adoption
  usageAndAdoption: "usage-and-adoption",
  newWallets: "new-wallets",
  renewalRate: "renewal-rate",
  revenueByPeriod: "revenue-by-period",

  // Charts
  nameGrowth: "name-growth",
  newRegistrants: "new-registrants",
  upcomingExpirations: "upcoming-expirations",
  renewalRateByYear: "renewal-rate-by-year",
} as const;

export type RevenueAnchor =
  (typeof REVENUE_ANCHORS)[keyof typeof REVENUE_ANCHORS];
