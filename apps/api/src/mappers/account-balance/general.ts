import { z } from "@hono/zod-openapi";
import { Address, getAddress, isAddress } from "viem";

import { accountBalance } from "@/database";

import {
  normalizeQueryArray,
  OrderDirectionSchema,
  paginationLimitQueryParam,
  paginationSkipQueryParam,
  PeriodResponseSchema,
  TimestampResponseMapper,
  unixTimestampQueryParam,
} from "../shared";

import {
  AccountBalanceVariationSchema,
  PercentageChangeMapper,
} from "./variations";

const AddressSchema = z
  .string()
  .refine((addr) => isAddress(addr, { strict: false }))
  .transform((addr) => getAddress(addr));

const AddressListSchema = z.preprocess(
  (value) => normalizeQueryArray(value) ?? [],
  z.array(
    z
      .string()
      .refine((addr) => isAddress(addr, { strict: false }), "Invalid address")
      .transform((addr) => getAddress(addr)),
  ),
);

export const AccountBalancesRequestSchema = z
  .object({
    fromDate: unixTimestampQueryParam(
      "Inclusive lower bound for balance history filters, in Unix seconds.",
    ),
    toDate: unixTimestampQueryParam(
      "Inclusive upper bound for balance history filters, in Unix seconds.",
    ),
    limit: paginationLimitQueryParam(),
    skip: paginationSkipQueryParam(),
    orderDirection: OrderDirectionSchema.optional().default("desc"),
    orderBy: z
      .enum(["balance", "variation", "signedVariation"])
      .optional()
      .default("balance"),
    excludeDaoAddresses: z
      .preprocess(
        (value) =>
          value === "true" ? true : value === "false" ? false : value,
        z.boolean().optional().default(false),
      )
      .openapi({
        description:
          "Whether DAO-owned addresses should be excluded from the results.",
        example: false,
        type: "boolean",
      }),
    addresses: AddressListSchema,
    delegates: AddressListSchema.openapi({
      description:
        "Filter by one or more delegate addresses. Pass repeated query params or a comma-delimited list.",
    }),
    fromValue: z
      .string()
      .transform((val) => BigInt(val))
      .openapi({
        description: "Minimum balance encoded as a decimal string.",
      })
      .optional(),
    toValue: z
      .string()
      .transform((val) => BigInt(val))
      .openapi({
        description: "Maximum balance encoded as a decimal string.",
      })
      .optional(),
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
    fromDate: unixTimestampQueryParam(
      "Inclusive lower bound for the returned balance period, in Unix seconds.",
    ),
    toDate: unixTimestampQueryParam(
      "Inclusive upper bound for the returned balance period, in Unix seconds.",
    ),
  })
  .openapi("AccountBalanceRequestQuery");

export const AccountBalanceResponseSchema = z
  .object({
    address: z.string().openapi({ description: "Account address." }),
    balance: z.string().openapi({
      description: "Current token balance encoded as a decimal string.",
    }),
    tokenId: z.string().openapi({ description: "Token contract address." }),
    delegate: z.string().openapi({ description: "Current delegate address." }),
  })
  .openapi("AccountBalance");

export const AccountBalanceWithVariationSchema = z
  .object({
    address: z.string(),
    balance: z.string(),
    tokenId: z.string(),
    delegate: z.string(),
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
