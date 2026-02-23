import { z } from "@hono/zod-openapi";
import { Address, getAddress, isAddress } from "viem";

import { accountBalance } from "@/database";

import { PeriodResponseSchema, TimestampResponseMapper } from "../shared";

export const AccountBalancesRequestSchema = z.object({
  fromDate: z
    .string()
    .transform((val) => Number(val))
    .optional(),
  toDate: z
    .string()
    .transform((val) => Number(val))
    .optional(),
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
  orderBy: z.enum(["balance", "variation"]).optional().default("balance"),
  addresses: z
    .union([
      z
        .string()
        .refine(isAddress, "Invalid address")
        .transform((addr) => [getAddress(addr)]),
      z.array(
        z
          .string()
          .refine(isAddress, "Invalid addresses")
          .transform((addr) => getAddress(addr)),
      ),
    ])
    .optional()
    .transform((val) => (val === undefined ? [] : val)),
  delegates: z
    .union([
      z
        .string()
        .refine(isAddress, "Invalid address")
        .transform((addr) => [getAddress(addr)]),
      z.array(
        z
          .string()
          .refine(isAddress, "Invalid addresses")
          .transform((addr) => getAddress(addr)),
      ),
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

export const AccountBalanceRequestParamSchema = z.object({
  address: z
    .string()
    .refine((addr) => isAddress(addr, { strict: false }))
    .transform((addr) => getAddress(addr)),
});

export const AccountBalanceRequestQuerySchema = z.object({
  fromDate: z
    .string()
    .transform((val) => Number(val))
    .optional(),
  toDate: z
    .string()
    .transform((val) => Number(val))
    .optional(),
});

export const AccountBalanceResponseSchema = z.object({
  address: z.string(),
  balance: z.string(),
  tokenId: z.string(),
  delegate: z.string(),
});

export const AccountBalanceWithVariationSchema = z.object({
  address: z.string(),
  balance: z.string(),
  tokenId: z.string(),
  delegate: z.string(),
  variation: z.object({
    previousBalance: z.string(),
    absoluteChange: z.string(),
    percentageChange: z.string(),
  }),
});

export const AccountBalancesWithVariationResponseSchema = z.object({
  items: z.array(AccountBalanceWithVariationSchema),
  period: PeriodResponseSchema,
  totalCount: z.number(),
});

export const AccountBalanceWithVariationResponseSchema = z.object({
  data: AccountBalanceWithVariationSchema,
  period: PeriodResponseSchema,
});

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
  totalCount: bigint,
  startTimestamp: number | undefined,
  endTimestamp: number | undefined,
): AccountBalancesWithVariationResponse => {
  return {
    items: items.map((item) => AccountBalanceWithVariationMapper(item)),
    totalCount: Number(totalCount),
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
      percentageChange: item.percentageChange,
      previousBalance: item.previousBalance.toString(),
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
