import { Address, isAddress } from "viem";
import { z } from "@hono/zod-openapi";
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
import { PERCENTAGE_NO_BASELINE } from "../constants";

export const AccountBalanceVariationsByAccountIdRequestParamsSchema = z.object({
  address: z.string().refine(isAddress, "Invalid address"),
});

export const AccountBalanceVariationsByAccountIdRequestQuerySchema = z.object({
  fromDate: FromDateStandardRequestParam,
  toDate: ToDateStandardRequestParam,
});

export const AccountBalanceVariationsRequestQuerySchema =
  AccountBalanceVariationsByAccountIdRequestQuerySchema.extend({
    limit: LimitStandardRequestParam,
    skip: OffsetStandardRequestParam,
    orderDirection: OrderDirectionStandardRequestParam,
    addresses: AddressSetStandardRequestParam.optional(),
  });

export const AccountBalanceVariationSchema = z.object({
  accountId: z.string(),
  previousBalance: z.string(),
  currentBalance: z.string(),
  absoluteChange: z.string(),
  percentageChange: z.string(),
});

export const AccountBalanceVariationsByAccountIdResponseSchema = z.object({
  period: PeriodResponseSchema,
  data: AccountBalanceVariationSchema,
});

export const AccountBalanceVariationsResponseSchema = z.object({
  period: PeriodResponseSchema,
  items: z.array(AccountBalanceVariationSchema),
});

export type AccountBalanceVariationsResponse = z.infer<
  typeof AccountBalanceVariationsResponseSchema
>;

export type AccountBalanceVariationResponse = z.infer<
  typeof AccountBalanceVariationsByAccountIdResponseSchema
>;

export type AccountBalanceVariation = z.infer<
  typeof AccountBalanceVariationSchema
>;

export type DBAccountBalanceVariation = {
  accountId: Address;
  previousBalance: bigint;
  currentBalance: bigint;
  absoluteChange: bigint;
  percentageChange: string;
};

export const AccountBalanceVariationMapper = (
  variation: DBAccountBalanceVariation,
): AccountBalanceVariation => ({
  accountId: variation.accountId,
  previousBalance: variation.previousBalance.toString(),
  currentBalance: variation.currentBalance.toString(),
  absoluteChange: variation.absoluteChange.toString(),
  percentageChange: variation.previousBalance
    ? variation.percentageChange.toString()
    : PERCENTAGE_NO_BASELINE,
});

export const AccountBalanceVariationsByAccountIdResponseMapper = (
  variation: DBAccountBalanceVariation,
  startTimestamp: number,
  endTimestamp: number,
): AccountBalanceVariationResponse => {
  return AccountBalanceVariationsByAccountIdResponseSchema.parse({
    period: PeriodResponseSchema.parse({
      startTimestamp: TimestampResponseMapper(startTimestamp),
      endTimestamp: TimestampResponseMapper(endTimestamp),
    }),
    data: AccountBalanceVariationMapper(variation),
  });
};

export const AccountBalanceVariationsResponseMapper = (
  variations: DBAccountBalanceVariation[],
  startTimestamp: number,
  endTimestamp: number,
): AccountBalanceVariationsResponse => {
  return AccountBalanceVariationsResponseSchema.parse({
    period: PeriodResponseSchema.parse({
      startTimestamp: TimestampResponseMapper(startTimestamp),
      endTimestamp: TimestampResponseMapper(endTimestamp),
    }),
    items: variations.map(AccountBalanceVariationMapper),
  });
};
