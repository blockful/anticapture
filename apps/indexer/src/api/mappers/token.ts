import { z } from "@hono/zod-openapi";

import { DaysOpts } from "@/lib/enums";

export const TokenHistoricalPriceRequest = z.object({
  days: z
    .enum(DaysOpts)
    .optional()
    .default("365d")
    .transform((val) => parseInt(val.replace("d", ""))),
});

export type TokenHistoricalPriceRequest = z.infer<
  typeof TokenHistoricalPriceRequest
>;

export const TokenHistoricalPriceResponse = z.array(
  z.object({
    price: z.string(),
    timestamp: z.string(),
  }),
);

export type TokenHistoricalPriceResponse = z.infer<
  typeof TokenHistoricalPriceResponse
>;
