import { DaysEnum } from "@/lib/enums";
import { z } from "@hono/zod-openapi";
import { Address, isAddress } from "viem";
import { accountPower } from "ponder:schema";

import { PERCENTAGE_NO_BASELINE } from "../constants";
import { PeriodResponseSchema, TimestampResponseMapper } from "../shared";

export const VotingPowerVariationsRequestSchema = z.object({
  addresses: z
    .union([
      z
        .string()
        .refine(isAddress, "Invalid address")
        .transform((addr) => [addr]),
      z.array(z.string().refine(isAddress, "Invalid addresses")),
    ])
    .optional()
    .transform((val) => (val === undefined ? [] : val)),
  fromDate: z
    .string()
    .optional()
    .transform((val) =>
      Number(
        val !== undefined
          ? val
          : (Math.floor(Date.now() / 1000) - DaysEnum["90d"]).toString(),
      ),
    ),
  toDate: z
    .string()
    .optional()
    .transform((val) =>
      Number(
        val !== undefined
          ? val
          : (Math.floor(Date.now() / 1000) - DaysEnum["90d"]).toString(),
      ),
    ),
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
  fromDate: z
    .string()
    .optional()
    .transform((val) =>
      Number(
        val !== undefined
          ? val
          : (Math.floor(Date.now() / 1000) - DaysEnum["90d"]).toString(),
      ),
    ),
  toDate: z
    .string()
    .optional()
    .transform((val) =>
      Number(
        val !== undefined
          ? val
          : (Math.floor(Date.now() / 1000) - DaysEnum["90d"]).toString(),
      ),
    ),
});

export const VotingPowersRequestSchema = z.object({
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
  orderBy: z
    .enum(["votingPower", "delegationsCount"])
    .optional()
    .default("votingPower"),
  addresses: z
    .union([
      z
        .string()
        .refine(isAddress, "Invalid address")
        .transform((addr) => [addr]),
      z.array(z.string().refine(isAddress, "Invalid addresses")),
    ])
    .optional()
    .transform((val) => (val === undefined ? [] : val)),
  fromValue: z
    .string()
    .transform((val) => BigInt(val))
    .optional(),
  toValue: z
    .string()
    .transform((val) => BigInt(val))
    .optional(),
});

export const VotingPowerVariationResponseSchema = z.object({
  accountId: z.string(),
  previousVotingPower: z.string(),
  currentVotingPower: z.string(),
  absoluteChange: z.string(),
  percentageChange: z.string(),
});

export const VotingPowerResponseSchema = z.object({
  accountId: z.string(),
  votingPower: z.string(),
  votesCount: z.number(),
  proposalsCount: z.number(),
  delegationsCount: z.number(),
});

export const VotingPowersResponseSchema = z.object({
  items: z.array(VotingPowerResponseSchema),
  totalCount: z.number(),
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

export type VotingPowersResponse = z.infer<typeof VotingPowersResponseSchema>;

export type VotingPowerResponse = z.infer<typeof VotingPowerResponseSchema>;

export type DBVotingPowerVariation = {
  accountId: Address;
  previousVotingPower: bigint;
  currentVotingPower: bigint;
  absoluteChange: bigint;
  percentageChange: number;
};

export type DBAccountPower = typeof accountPower.$inferSelect;

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
  startTimestamp: number,
  endTimestamp: number,
): VotingPowerVariationsResponse => {
  return VotingPowerVariationsResponseSchema.parse({
    period: PeriodResponseSchema.parse({
      startTimestamp: TimestampResponseMapper(startTimestamp),
      endTimestamp: TimestampResponseMapper(endTimestamp),
    }),
    items: variations.map(VotingPowerVariationResponseMapper),
  });
};

export const VotingPowerVariationsByAccountIdMapper = (
  delta: DBVotingPowerVariation,
  startTimestamp: number,
  endTimestamp: number,
): VotingPowerVariationsByAccountIdResponse => {
  return VotingPowerVariationsByAccountIdResponseSchema.parse({
    period: PeriodResponseSchema.parse({
      startTimestamp: TimestampResponseMapper(startTimestamp),
      endTimestamp: TimestampResponseMapper(endTimestamp),
    }),
    data: VotingPowerVariationResponseMapper(delta),
  });
};

export const VotingPowerMapper = (
  data: DBAccountPower,
): VotingPowerResponse => {
  return VotingPowerResponseSchema.parse({
    accountId: data.accountId,
    votingPower: data.votingPower.toString(),
    votesCount: data.votesCount,
    proposalsCount: data.proposalsCount,
    delegationsCount: data.delegationsCount,
  });
};

export const VotingPowersMapper = (
  items: DBAccountPower[],
  totalCount: number,
): VotingPowersResponse => {
  return VotingPowersResponseSchema.parse({
    totalCount: totalCount,
    items: items.map(VotingPowerMapper),
  });
};
