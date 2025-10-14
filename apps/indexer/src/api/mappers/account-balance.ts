import { DaysEnum, DaysOpts } from "@/lib/enums";
import { secondsToDays } from "@/lib/utils";
import { z } from "@hono/zod-openapi";
import { Address } from "viem";

export const TopAccountBalanceVariationsRequestSchema = z.object({
  days: z
    .enum(DaysOpts)
    .optional()
    .default("90d")
    .transform((val) => DaysEnum[val]),
  limit: z.coerce
    .number()
    .int()
    .min(1, "Limit must be a positive integer")
    .max(100, "Limit cannot exceed 100")
    .optional()
    .default(20),
  skip: z.coerce
    .number()
    .int()
    .min(0, "Skip must be a non-negative integer")
    .optional()
    .default(0),
  orderDirection: z.enum(["asc", "desc"]).optional().default("desc"),
});

export const TopAccountBalanceVariationsResponseSchema = z.object({
  period: z.object({
    days: z.number().transform((val) => secondsToDays(val)),
    startTimestamp: z.string(),
    endTimestamp: z.string(),
  }),
  items: z.array(
    z.object({
      accountId: z.string(),
      previousBalance: z.string(),
      currentBalance: z.string(),
      absoluteChange: z.string(),
      percentageChange: z.string(),
    }),
  ),
});

export type TopAccountBalanceVariationsResponse = z.infer<
  typeof TopAccountBalanceVariationsResponseSchema
>;

export type DBAccountBalanceVariation = {
  accountId: Address;
  previousBalance: bigint;
  currentBalance: bigint;
  absoluteChange: bigint;
  percentageChange: number;
};

export const TopAccountBalanceVariationsMapper = (
  variations: DBAccountBalanceVariation[],
  endTimestamp: number,
  days: DaysEnum,
): TopAccountBalanceVariationsResponse => {
  return TopAccountBalanceVariationsResponseSchema.parse({
    period: {
      days: days,
      startTimestamp: new Date((endTimestamp - days) * 1000).toISOString(),
      endTimestamp: new Date(endTimestamp * 1000).toISOString(),
    },
    items: variations.map(
      ({
        accountId,
        previousBalance,
        currentBalance,
        absoluteChange,
        percentageChange,
      }) => ({
        accountId: accountId,
        previousBalance: previousBalance.toString(),
        currentBalance: currentBalance.toString(),
        absoluteChange: absoluteChange.toString(),
        percentageChange: previousBalance ? percentageChange.toString() : "NEW",
      }),
    ),
  });
};
