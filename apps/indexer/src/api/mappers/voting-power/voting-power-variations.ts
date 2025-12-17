import { DaysEnum, DaysOpts } from "@/lib/enums";
import { z } from "@hono/zod-openapi";
import { PERCENTAGE_NO_BASELINE } from "../constants";
import { PeriodResponseMapper, PeriodResponseSchema } from "../shared";

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

export const VotingPowerVariationsByAccountIdRequestSchema = z.object({
  days: z
    .enum(DaysOpts)
    .optional()
    .default("90d")
    .transform((val) => DaysEnum[val]),
});

export const VotingPowerVariationResponseSchema = z.object({
  accountId: z.string(),
  previousVotingPower: z.string().nullish(),
  currentVotingPower: z.string(),
  absoluteChange: z.string(),
  percentageChange: z.string(),
});

export const VotingPowerVariationsByAccountIdResponseSchema = z.object({
  period: PeriodResponseSchema,
  data: VotingPowerVariationResponseSchema,
});

export const VotingPowerVariationsResponseSchema = z.object({
  period: PeriodResponseSchema,
  items: z.array(VotingPowerVariationResponseSchema),
});

export type VotingPowerVariationResponse = z.infer<
  typeof VotingPowerVariationResponseSchema
>;

export type VotingPowerVariationsResponse = z.infer<
  typeof VotingPowerVariationsResponseSchema
>;

export type VotingPowerVariationsByAccountIdResponse = z.infer<
  typeof VotingPowerVariationsByAccountIdResponseSchema
>;

export type DBVotingPowerVariation = {
  accountId: `0x${string}`;
  previousVotingPower: bigint | null;
  currentVotingPower: bigint;
  absoluteChange: bigint;
  percentageChange: number;
};

export const VotingPowerVariationResponseMapper = (
  delta: DBVotingPowerVariation,
): VotingPowerVariationResponse => ({
  accountId: delta.accountId,
  previousVotingPower: delta.previousVotingPower?.toString(),
  currentVotingPower: delta.currentVotingPower.toString(),
  absoluteChange: delta.absoluteChange.toString(),
  percentageChange: delta.previousVotingPower
    ? delta.percentageChange.toString()
    : PERCENTAGE_NO_BASELINE,
});

export const VotingPowerVariationsMapper = (
  variations: DBVotingPowerVariation[],
  endTimestamp: number,
  days: DaysEnum,
): VotingPowerVariationsResponse => {
  return VotingPowerVariationsResponseSchema.parse({
    period: PeriodResponseMapper(endTimestamp, days),
    items: variations.map(VotingPowerVariationResponseMapper),
  });
};

export const VotingPowerVariationsByAccountIdMapper = (
  delta: DBVotingPowerVariation,
  endTimestamp: number,
  days: DaysEnum,
): VotingPowerVariationsByAccountIdResponse => {
  return VotingPowerVariationsByAccountIdResponseSchema.parse({
    period: PeriodResponseMapper(endTimestamp, days),
    data: VotingPowerVariationResponseMapper(delta),
  });
};
