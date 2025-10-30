import { DaysEnum, DaysOpts } from "@/lib/enums";
import { z } from "@hono/zod-openapi";
import { PERCENTAGE_NO_BASELINE } from "../constants";

export const VotingPowerVariationsRequestSchema = z.object({
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

export const VotingPowerVariationsResponseSchema = z.object({
  period: z.object({
    days: z.string(),
    startTimestamp: z.string(),
    endTimestamp: z.string(),
  }),
  items: z.array(
    z.object({
      accountId: z.string(),
      previousVotingPower: z.string().nullish(),
      currentVotingPower: z.string(),
      absoluteChange: z.string(),
      percentageChange: z.string(),
    }),
  ),
});

export type VotingPowerVariationsResponse = z.infer<
  typeof VotingPowerVariationsResponseSchema
>;

export type DBVotingPowerVariation = {
  accountId: `0x${string}`;
  previousVotingPower: bigint | null;
  currentVotingPower: bigint;
  absoluteChange: bigint;
  percentageChange: number;
};

export const VotingPowerVariationsMapper = (
  variations: DBVotingPowerVariation[],
  endTimestamp: number,
  days: DaysEnum,
): VotingPowerVariationsResponse => {
  return VotingPowerVariationsResponseSchema.parse({
    period: {
      days: DaysEnum[days] as string,
      startTimestamp: new Date((endTimestamp - days) * 1000).toISOString(),
      endTimestamp: new Date(endTimestamp * 1000).toISOString(),
    },
    items: variations.map(
      ({
        accountId,
        previousVotingPower,
        currentVotingPower,
        absoluteChange,
        percentageChange,
      }) => ({
        accountId: accountId,
        previousVotingPower: previousVotingPower?.toString(),
        currentVotingPower: currentVotingPower.toString(),
        absoluteChange: absoluteChange.toString(),
        percentageChange: previousVotingPower
          ? percentageChange.toString()
          : PERCENTAGE_NO_BASELINE,
      }),
    ),
  });
};
