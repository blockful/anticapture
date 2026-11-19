import { z } from "@hono/zod-openapi";

import { OrderDirectionSchema, unixTimestampQueryParam } from "../shared";

export const RevenueQuerySchema = z
  .object({
    fromDate: unixTimestampQueryParam(
      "Inclusive lower bound for the data range, as a Unix timestamp in seconds.",
    ),
    toDate: unixTimestampQueryParam(
      "Inclusive upper bound for the data range, as a Unix timestamp in seconds.",
    ),
    orderDirection: OrderDirectionSchema.optional().default("asc"),
  })
  .openapi("RevenueQuery", {
    description: "Common query params for the /revenue/* endpoints.",
  });

export type RevenueQuery = z.infer<typeof RevenueQuerySchema>;

export const RevenueMetaSchema = z
  .object({
    asOf: z
      .string()
      .nullable()
      .openapi({ example: "2026-09-23T00:08:52.123Z" })
      .describe(
        "When the upstream computation behind these items finished, as an ISO-8601 UTC timestamp (Dune's execution_ended_at). Null when unknown or when nothing could be served.",
      ),
    degraded: z
      .boolean()
      .describe(
        "True when the API served a stale copy or an empty fallback after the upstream failed, or the data source is not configured. Degraded responses are sent with Cache-Control: no-store. This reflects the API's own fallbacks only: a copy the gateway serves stale after an API error keeps its original meta and is marked by the `Cache-Status: Redis; stale` header instead.",
      ),
  })
  .openapi("RevenueMeta", {
    description: "Freshness of a /revenue/* response.",
  });

export const RevenueActionCategorySchema = z
  .enum(["Registration", "Renewal", "Premium"])
  .openapi("RevenueActionCategory", {
    description: "Category of ENS revenue-generating action.",
  });

export const RevenueActionsItemSchema = z
  .object({
    date: z
      .number()
      .int()
      .describe("Month start (Unix timestamp in seconds, UTC)."),
    category: RevenueActionCategorySchema,
    actions: z
      .number()
      .int()
      .describe("Number of actions of this category in the given month."),
  })
  .openapi("RevenueActionsItem", {
    description: "Single revenue actions datapoint.",
  });

export const RevenueActionsResponseSchema = z
  .object({
    items: z.array(RevenueActionsItemSchema),
    totalCount: z.number().int().describe("Total number of items returned."),
    meta: RevenueMetaSchema,
  })
  .openapi("RevenueActionsResponse", {
    description:
      "Monthly action counts by category (Registration, Renewal, Premium).",
  });

export type RevenueActionsResponse = z.infer<
  typeof RevenueActionsResponseSchema
>;

export const RevenueActiveNamesItemSchema = z
  .object({
    date: z
      .number()
      .int()
      .describe("Month start (Unix timestamp in seconds, UTC)."),
    netChange: z
      .number()
      .describe("Net change in active .eth names for the month."),
    cumulativeActive: z
      .number()
      .describe("Cumulative count of active .eth names as of the month."),
  })
  .openapi("RevenueActiveNamesItem", {
    description: "Single active-names datapoint.",
  });

export const RevenueActiveNamesResponseSchema = z
  .object({
    items: z.array(RevenueActiveNamesItemSchema),
    totalCount: z.number().int().describe("Total number of items returned."),
    meta: RevenueMetaSchema,
  })
  .openapi("RevenueActiveNamesResponse", {
    description:
      "Monthly net change and cumulative count of active .eth names.",
  });

export type RevenueActiveNamesResponse = z.infer<
  typeof RevenueActiveNamesResponseSchema
>;

export const RevenueNewWalletsItemSchema = z
  .object({
    date: z
      .number()
      .int()
      .describe("Month start (Unix timestamp in seconds, UTC)."),
    newWallets: z
      .number()
      .describe("New wallets that interacted with ENS in the given month."),
    cumulativeWallets: z
      .number()
      .describe("Cumulative count of ENS wallets as of the given month."),
  })
  .openapi("RevenueNewWalletsItem", {
    description: "Single new-wallets datapoint.",
  });

export const RevenueNewWalletsResponseSchema = z
  .object({
    items: z.array(RevenueNewWalletsItemSchema),
    totalCount: z.number().int().describe("Total number of items returned."),
    meta: RevenueMetaSchema,
  })
  .openapi("RevenueNewWalletsResponse", {
    description:
      "Monthly new-wallet counts and the cumulative wallet total for ENS.",
  });

export type RevenueNewWalletsResponse = z.infer<
  typeof RevenueNewWalletsResponseSchema
>;

export const RevenueRenewalFunnelItemSchema = z
  .object({
    date: z
      .number()
      .int()
      .describe("Expiry month start (Unix timestamp in seconds, UTC)."),
    termsExpiring: z
      .number()
      .describe(
        ".eth terms expiring in the given month, counted once their expiry is more than 90 days before the data was computed (the latest month can be partial).",
      ),
    renewedCount: z
      .number()
      .describe("Number of expiring terms that were renewed."),
    churnedCount: z
      .number()
      .describe("Number of expiring terms that were not renewed."),
    renewalRatePct: z
      .number()
      .describe("Renewal rate for the month, as a percentage (0-100)."),
  })
  .openapi("RevenueRenewalFunnelItem", {
    description: "Single renewal-funnel datapoint keyed by expiry month.",
  });

export const RevenueRenewalFunnelResponseSchema = z
  .object({
    items: z.array(RevenueRenewalFunnelItemSchema),
    totalCount: z.number().int().describe("Total number of items returned."),
    meta: RevenueMetaSchema,
  })
  .openapi("RevenueRenewalFunnelResponse", {
    description:
      "Renewal funnel per expiry month: terms expiring, renewed, churned, and renewal rate.",
  });

export type RevenueRenewalFunnelResponse = z.infer<
  typeof RevenueRenewalFunnelResponseSchema
>;

export const RevenueTotalsItemSchema = z
  .object({
    date: z
      .number()
      .int()
      .describe("Month start (Unix timestamp in seconds, UTC)."),
    registrationUsd: z
      .number()
      .describe("USD revenue from new .eth registrations in the month."),
    premiumUsd: z
      .number()
      .describe(
        "USD revenue from temporary premium auctions in the given month, as recorded separately by the 2023 and later controllers; premiums paid through the 2020 controller are included in registrationUsd.",
      ),
    renewalUsd: z
      .number()
      .describe("USD revenue from .eth renewals in the given month."),
    totalUsd: z
      .number()
      .describe(
        "Total USD revenue for the month (upstream sum; not recomputed).",
      ),
    registrationEth: z
      .number()
      .describe("ETH revenue from new .eth registrations in the month."),
    premiumEth: z
      .number()
      .describe(
        "ETH revenue from temporary premium auctions in the given month, as recorded separately by the 2023 and later controllers; premiums paid through the 2020 controller are included in registrationEth.",
      ),
    renewalEth: z
      .number()
      .describe("ETH revenue from .eth renewals in the given month."),
  })
  .openapi("RevenueTotalsItem", {
    description: "Single revenue-totals datapoint.",
  });

export const RevenueTotalsResponseSchema = z
  .object({
    items: z.array(RevenueTotalsItemSchema),
    totalCount: z.number().int().describe("Total number of items returned."),
    meta: RevenueMetaSchema,
  })
  .openapi("RevenueTotalsResponse", {
    description:
      "Monthly ENS revenue totals split into registration, premium, and renewal, in both USD and ETH.",
  });

export type RevenueTotalsResponse = z.infer<typeof RevenueTotalsResponseSchema>;

export const RevenueRenewalTenureBucketSchema = z
  .enum(["0 renewals (one-shot)", "1 renewal", "2 renewals", "3+ renewals"])
  .openapi("RevenueRenewalTenureBucket", {
    description: "Tenure bucket label as returned by Dune.",
  });

export const RevenueRenewalTenureItemSchema = z
  .object({
    date: z
      .number()
      .int()
      .describe("Expiry month start (Unix timestamp in seconds, UTC)."),
    tenureBucket: RevenueRenewalTenureBucketSchema,
    names: z
      .number()
      .int()
      .describe("Count of names in this tenure bucket for the expiry month."),
    totalRenewalsInBucket: z
      .number()
      .int()
      .describe("Total renewals contributed by names in this bucket."),
  })
  .openapi("RevenueRenewalTenureItem", {
    description: "Single renewal-tenure datapoint keyed by expiry month.",
  });

export const RevenueRenewalTenureResponseSchema = z
  .object({
    items: z.array(RevenueRenewalTenureItemSchema),
    totalCount: z.number().int().describe("Total number of items returned."),
    meta: RevenueMetaSchema,
  })
  .openapi("RevenueRenewalTenureResponse", {
    description:
      "Per expiry month, count of names in each tenure bucket (0/1/2/3+ renewals) and the total renewals in that bucket.",
  });

export type RevenueRenewalTenureResponse = z.infer<
  typeof RevenueRenewalTenureResponseSchema
>;

export const RevenueByCategoryCategorySchema = z
  .enum(["Registration", "Renewal"])
  .openapi("RevenueByCategoryCategory", {
    description:
      "Revenue category as reported by the Steakhouse accounting ledger.",
  });

export const RevenueByCategoryItemSchema = z
  .object({
    date: z
      .number()
      .int()
      .describe("Month start (Unix timestamp in seconds, UTC)."),
    category: RevenueByCategoryCategorySchema,
    revenueUsd: z
      .number()
      .describe("USD revenue for the category in the given month."),
    revenueEth: z
      .number()
      .describe("ETH revenue for the category in the given month."),
  })
  .openapi("RevenueByCategoryItem", {
    description: "Single revenue-by-category datapoint.",
  });

export const RevenueByCategoryResponseSchema = z
  .object({
    items: z.array(RevenueByCategoryItemSchema),
    totalCount: z.number().int().describe("Total number of items returned."),
    meta: RevenueMetaSchema,
  })
  .openapi("RevenueByCategoryResponse", {
    description:
      "Monthly ENS revenue split by category (Registration vs Renewal) in USD and ETH, sourced from the Steakhouse accounting ledger.",
  });

export type RevenueByCategoryResponse = z.infer<
  typeof RevenueByCategoryResponseSchema
>;
