import { z } from "@hono/zod-openapi";
import { DaysWindow, OrderDirectionSchema } from "../shared";

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
    days: DaysWindow.default("_365d"),
    orderDirection: OrderDirectionSchema.optional(),
  })
  .openapi("TreasuryQuery", {
    description: "Query params used to fetch treasury time-series data.",
  });
