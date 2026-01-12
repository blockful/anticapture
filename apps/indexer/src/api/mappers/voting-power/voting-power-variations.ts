import { DaysEnum } from "@/lib/enums";
import { z } from "@hono/zod-openapi";
import { PERCENTAGE_NO_BASELINE } from "../constants";
import { PeriodResponseMapper, PeriodResponseSchema } from "../shared";
import { Address, isAddress } from "viem";

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
    .default((Math.floor(Date.now() / 1000) - DaysEnum["90d"]).toString())
    .transform((val) => Number(val)),
  toDate: z
    .string()
    .optional()
    .default(Math.floor(Date.now() / 1000).toString())
    .transform((val) => Number(val)),
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
    .default((Math.floor(Date.now() / 1000) - DaysEnum["90d"]).toString())
    .transform((val) => Number(val)),
  toDate: z
    .string()
    .optional()
    .default(Math.floor(Date.now() / 1000).toString())
    .transform((val) => Number(val)),
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
  addresses: z
    .array(z.string().refine((addr) => isAddress(addr)))
    .optional()
    .default([]),
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
  previousVotingPower: z.string().nullish(),
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
  accountId: `0x${string}`;
  previousVotingPower: bigint | null;
  currentVotingPower: bigint;
  absoluteChange: bigint;
  percentageChange: number;
};

export type DBAccountPower = {
  accountId: Address;
  votingPower: bigint;
  votesCount: number;
  proposalsCount: number;
  delegationsCount: number;
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
