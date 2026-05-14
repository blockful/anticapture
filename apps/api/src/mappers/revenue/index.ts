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
  })
  .openapi("RevenueNewWalletsResponse", {
    description:
      "Monthly new-wallet counts and the cumulative wallet total for ENS.",
  });

export type RevenueNewWalletsResponse = z.infer<
  typeof RevenueNewWalletsResponseSchema
>;

export const RevenuePremiumEthItemSchema = z
  .object({
    date: z
      .number()
      .int()
      .describe("Month start (Unix timestamp in seconds, UTC)."),
    baseEth: z
      .number()
      .describe("Base registration ETH from temporary premium auctions."),
    premiumEth: z
      .number()
      .describe("Premium ETH from temporary premium auctions."),
    totalEth: z
      .number()
      .describe(
        "Total ETH (base + premium) from temporary premium auctions in the given month.",
      ),
  })
  .openapi("RevenuePremiumEthItem", {
    description: "Single premium-ETH datapoint.",
  });

export const RevenuePremiumEthResponseSchema = z
  .object({
    items: z.array(RevenuePremiumEthItemSchema),
    totalCount: z.number().int().describe("Total number of items returned."),
  })
  .openapi("RevenuePremiumEthResponse", {
    description:
      "Monthly base/premium/total ETH from temporary premium auctions. Data starts April 2023 (when premium auctions launched).",
  });

export type RevenuePremiumEthResponse = z.infer<
  typeof RevenuePremiumEthResponseSchema
>;
