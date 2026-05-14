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
