import { z } from "@hono/zod-openapi";
import { DaysOpts } from "@/lib/enums";

export const TreasuryResponseSchema = z.object({
  items: z.array(
    z.object({
      value: z.number().describe("Treasury value in USD"),
      date: z.number().describe("Unix timestamp in milliseconds"),
    }),
  ),
  totalCount: z.number().describe("Total number of items"),
});

export const TreasuryQuerySchema = z.object({
  days: z
    .enum(DaysOpts)
    .default("365d")
    .transform((val) => parseInt(val.replace("d", ""))),
  order: z.enum(["asc", "desc"]).optional().default("asc"),
});
