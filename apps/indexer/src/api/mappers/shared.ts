import { z } from "@hono/zod-openapi";
import { PERIOD_UNBOUND } from "./constants";

export type AmountFilter = {
  minAmount: number | bigint | undefined;
  maxAmount: number | bigint | undefined;
};

export const PeriodResponseSchema = z.object({
  startTimestamp: z.string(),
  endTimestamp: z.string(),
});

export type PeriodResponse = z.infer<typeof PeriodResponseSchema>;

export const TimestampResponseMapper = (
  timestamp: number | undefined,
): string => {
  return timestamp ? new Date(timestamp * 1000).toISOString() : PERIOD_UNBOUND;
};
