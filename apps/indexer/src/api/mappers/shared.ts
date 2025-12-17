import { DaysEnum } from "@/lib/enums";
import { z } from "@hono/zod-openapi";

export const PeriodResponseSchema = z.object({
  days: z.string(),
  startTimestamp: z.string(),
  endTimestamp: z.string(),
});

export type PeriodResponse = z.infer<typeof PeriodResponseSchema>;

export const PeriodResponseMapper = (
  endTimestamp: number,
  days: DaysEnum,
): PeriodResponse => ({
  days: DaysEnum[days] as string,
  startTimestamp: new Date((endTimestamp - days) * 1000).toISOString(),
  endTimestamp: new Date(endTimestamp * 1000).toISOString(),
});
