import { z } from "@hono/zod-openapi";

export type AmountFilter = {
  minAmount: number | bigint | undefined;
  maxAmount: number | bigint | undefined;
};

export const PeriodResponseSchema = z.object({
  startTimestamp: z.string(),
  endTimestamp: z.string(),
});

export type PeriodResponse = z.infer<typeof PeriodResponseSchema>;

export const TimestampResponseMapper = (timestamp: number): string =>
  new Date(timestamp * 1000).toISOString();
