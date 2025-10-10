import { z } from "@hono/zod-openapi";

export const TokenHistoricalPriceRequest = z.object({
  skip: z.coerce
    .number()
    .int()
    .min(0, "Skip must be a non-negative integer")
    .optional()
    .default(0),
  limit: z.coerce.number().max(365).optional().default(365),
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
