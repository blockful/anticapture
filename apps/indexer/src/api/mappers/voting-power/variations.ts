import { z } from "@hono/zod-openapi";
import { Address, isAddress } from "viem";
import { accountPower } from "ponder:schema";

import {
  AddressSetStandardRequestParam,
  FromDateStandardRequestParam,
  LimitStandardRequestParam,
  OffsetStandardRequestParam,
  OrderDirectionStandardRequestParam,
  PeriodResponseSchema,
  TimestampResponseMapper,
  ToDateStandardRequestParam,
} from "../shared";

export const VotingPowerVariationsByAccountIdRequestParamsSchema = z.object({
  address: z.string().refine(isAddress, "Invalid address"),
});

export const VotingPowerVariationsByAccountIdRequestQuerySchema = z.object({
  fromDate: FromDateStandardRequestParam,
  toDate: ToDateStandardRequestParam,
});

export const VotingPowerVariationsRequestQuerySchema = z
  .object({
    limit: LimitStandardRequestParam,
    skip: OffsetStandardRequestParam,
    orderDirection: OrderDirectionStandardRequestParam,
    addresses: AddressSetStandardRequestParam.optional(),
  })
  .extend(VotingPowerVariationsByAccountIdRequestQuerySchema.shape);

export const VotingPowersRequestSchema = z.object({
  limit: LimitStandardRequestParam,
  skip: OffsetStandardRequestParam,
  orderDirection: OrderDirectionStandardRequestParam,
  orderBy: z
    .enum(["votingPower", "delegationsCount"])
    .optional()
    .default("votingPower"),
  addresses: AddressSetStandardRequestParam.optional().transform(
    (val) => val ?? [],
  ),
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
  percentageChange: string;
};

export type DBAccountPower = typeof accountPower.$inferSelect;

export const VotingPowerVariationResponseMapper = (
  delta: DBVotingPowerVariation,
): VotingPowerVariationResponse => ({
  accountId: delta.accountId,
  previousVotingPower: delta.previousVotingPower?.toString(),
  currentVotingPower: delta.currentVotingPower.toString(),
  absoluteChange: delta.absoluteChange.toString(),
  percentageChange: delta.percentageChange,
});

export const VotingPowerVariationsResponseMapper = (
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

export const VotingPowerVariationsByAccountIdResponseMapper = (
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
