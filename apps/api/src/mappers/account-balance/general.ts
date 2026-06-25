import { z } from "@hono/zod-openapi";
import { Address } from "viem";

import { accountBalance } from "@/database";

import {
  AddressQueryArraySchema,
  AddressSchema,
  PeriodResponseSchema,
  TimestampResponseMapper,
  addressOutputField,
  bigIntRangeQueryParams,
  decimalStringField,
  defaultDescOrderDirection,
  inclusiveDateRangeQueryParams,
  paginationQueryParams,
} from "../shared";

import {
  AccountBalanceVariationSchema,
  PercentageChangeMapper,
} from "./variations";

export const AccountBalancesRequestSchema = z
  .object({
    ...inclusiveDateRangeQueryParams("balance history filters"),
    ...paginationQueryParams(),
    orderDirection: defaultDescOrderDirection(),
    orderBy: z
      .enum(["balance", "variation", "signedVariation"])
      .optional()
      .default("balance"),
    excludeDaoAddresses: z.coerce.boolean().optional().default(false).openapi({
      description:
        "Whether DAO-owned addresses should be excluded from the results.",
      example: false,
    }),
    addresses: AddressQueryArraySchema.default([]),
    delegates: AddressQueryArraySchema.default([]).openapi({
      description:
        "Filter by one or more delegate addresses. Pass repeated query params or a comma-delimited list.",
    }),
    ...bigIntRangeQueryParams("balance"),
  })
  .openapi("AccountBalancesRequest");

export const AccountBalanceRequestParamSchema = z
  .object({
    address: AddressSchema.openapi({
      param: {
        description: "Wallet address whose balance is being queried.",
        example: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      },
    }),
  })
  .openapi("AccountBalanceRequestParams");

export const AccountBalanceRequestQuerySchema = z
  .object({
    ...inclusiveDateRangeQueryParams("the returned balance period"),
  })
  .openapi("AccountBalanceRequestQuery");

export const AccountBalanceResponseSchema = z
  .object({
    address: addressOutputField("Account address."),
    balance: decimalStringField(
      "Current token balance encoded as a decimal string.",
    ),
    tokenId: addressOutputField("Token contract address."),
    delegate: addressOutputField("Current delegate address."),
  })
  .openapi("AccountBalance");

export const AccountBalanceWithVariationSchema = z
  .object({
    address: z.string().openapi({ format: "ethereum-address" }),
    balance: z.string().openapi({ format: "int64" }),
    tokenId: z.string().openapi({ format: "ethereum-address" }),
    delegate: z.string().openapi({ format: "ethereum-address" }),
    variation: AccountBalanceVariationSchema,
  })
  .openapi("AccountBalanceWithVariation");

export const AccountBalancesWithVariationResponseSchema = z
  .object({
    items: z.array(AccountBalanceWithVariationSchema),
    period: PeriodResponseSchema,
    totalCount: z.number().int(),
  })
  .openapi("AccountBalancesWithVariationResponse");

export const AccountBalanceWithVariationResponseSchema = z
  .object({
    data: AccountBalanceWithVariationSchema,
    period: PeriodResponseSchema,
  })
  .openapi("AccountBalanceWithVariationResponse");

export type AccountBalanceResponse = z.infer<
  typeof AccountBalanceResponseSchema
>;

export type AccountBalanceWithVariation = z.infer<
  typeof AccountBalanceWithVariationSchema
>;

export type AccountBalanceWithVariationResponse = z.infer<
  typeof AccountBalanceWithVariationResponseSchema
>;

export type AccountBalancesWithVariationResponse = z.infer<
  typeof AccountBalancesWithVariationResponseSchema
>;

export const AccountBalancesWithVariationResponseMapper = (
  items: DBAccountBalanceWithVariation[],
  totalCount: number,
  startTimestamp: number | undefined,
  endTimestamp: number | undefined,
): AccountBalancesWithVariationResponse => {
  return {
    items: items.map((item) => AccountBalanceWithVariationMapper(item)),
    totalCount,
    period: PeriodResponseSchema.parse({
      startTimestamp: TimestampResponseMapper(startTimestamp),
      endTimestamp: TimestampResponseMapper(endTimestamp),
    }),
  };
};

export const AccountBalanceWithVariationResponseMapper = (
  data: DBAccountBalanceWithVariation,
  startTimestamp: number | undefined,
  endTimestamp: number | undefined,
): AccountBalanceWithVariationResponse => {
  return {
    data: AccountBalanceWithVariationMapper(data),
    period: PeriodResponseSchema.parse({
      startTimestamp: TimestampResponseMapper(startTimestamp),
      endTimestamp: TimestampResponseMapper(endTimestamp),
    }),
  };
};

export const AccountBalanceWithVariationMapper = (
  item: DBAccountBalanceWithVariation,
): AccountBalanceWithVariation => {
  return {
    address: item.accountId,
    balance: item.currentBalance.toString(),
    tokenId: item.tokenId,
    delegate: item.delegate,
    variation: {
      absoluteChange: item.absoluteChange.toString(),
      percentageChange: PercentageChangeMapper(item),
      previousBalance: item.previousBalance.toString(),
      accountId: item.accountId,
      currentBalance: item.currentBalance.toString(),
    },
  };
};

export type DBAccountBalanceWithVariation = {
  accountId: Address;
  tokenId: Address;
  delegate: Address;
  previousBalance: bigint;
  currentBalance: bigint;
  absoluteChange: bigint;
  percentageChange: string;
};

export type DBAccountBalance = typeof accountBalance.$inferSelect;

export interface Filter {
  address?: Address;
  minAmount?: bigint;
  maxAmount?: bigint;
}
