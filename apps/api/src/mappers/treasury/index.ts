import { z } from "@hono/zod-openapi";

import { DaysOpts } from "@/lib/enums";

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
    totalCount: z.number().describe("Total number of items"),
  })
  .openapi("TreasuryResponse", {
    description: "Paginated treasury time-series response.",
  });

export type TreasuryResponse = z.infer<typeof TreasuryResponseSchema>;

export const TreasuryQuerySchema = z
  .object({
    days: z
      .enum(DaysOpts)
      .default("365d")
      .transform((val) => parseInt(val.replace("d", ""))),
    order: z.enum(["asc", "desc"]).optional().default("asc"),
  })
  .openapi("TreasuryQuery", {
    description: "Query params used to fetch treasury time-series data.",
  });
