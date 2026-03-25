import { z } from "@hono/zod-openapi";

const TreasuryDaysWindowSchema = z
  .enum(["7d", "30d", "90d", "180d", "365d"])
  .openapi("DaysWindow");

const TreasuryOrderDirectionSchema = z
  .enum(["asc", "desc"])
  .openapi("OrderDirection");

export const TreasuryItemSchema = z
  .object({
    value: z.number().describe("Treasury value in USD"),
    date: z.number().describe("Unix timestamp in milliseconds"),
  })
  .openapi("TreasuryItem", {
    description: "Single treasury time-series datapoint.",
  });

export const TreasuryResponseSchema = z
  .object({
    items: z.array(TreasuryItemSchema),
    totalCount: z.number().int().describe("Total number of items"),
  })
  .openapi("TreasuryResponse", {
    description: "Paginated treasury time-series response.",
  });

export type TreasuryResponse = z.infer<typeof TreasuryResponseSchema>;

export const TreasuryQuerySchema = z
  .object({
    days: TreasuryDaysWindowSchema.optional(),
    orderDirection: TreasuryOrderDirectionSchema.optional(),
  })
  .openapi("TreasuryQuery", {
    description: "Query params used to fetch treasury time-series data.",
  });
