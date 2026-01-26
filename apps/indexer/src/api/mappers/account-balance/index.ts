import { z } from "@hono/zod-openapi";
import { Address } from "viem";
import { accountBalance } from "ponder:schema";

import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { DaoIdEnum, DaysEnum, DaysOpts } from "@/lib/enums";
import { PERCENTAGE_NO_BASELINE } from "@/api/mappers/constants";
import { calculateHistoricalBlockNumber } from "@/lib/blockTime";
import { PeriodResponseMapper, PeriodResponseSchema } from "../shared";
import { toLowerCaseAddress } from "@/lib/utils";

export const AccountBalancesRequestSchema = z.object({
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
    .union([
      z.string().transform((addr) => [toLowerCaseAddress(addr)]),
      z.array(z.string().transform((addr) => toLowerCaseAddress(addr))),
    ])
    .optional()
    .transform((val) => (val === undefined ? [] : val)),
  delegates: z
    .union([
      z.string().transform((addr) => [toLowerCaseAddress(addr)]),
      z.array(z.string().transform((addr) => toLowerCaseAddress(addr))),
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

export const AccountBalanceResponseSchema = z.object({
  accountId: z.string(),
  balance: z.string(),
  tokenId: z.string(),
  delegate: z.string(),
});

export const AccountBalancesResponseSchema = z.object({
  items: z.array(AccountBalanceResponseSchema),
  totalCount: z.number(),
});

export type AccountBalancesResponse = z.infer<
  typeof AccountBalancesResponseSchema
>;

export type AccountBalanceResponse = z.infer<
  typeof AccountBalanceResponseSchema
>;

export const AccountBalancesResponseMapper = (
  items: DBAccountBalance[],
  totalCount: bigint,
): AccountBalancesResponse => {
  return {
    totalCount: Number(totalCount),
    items: items.map((item) => AccountBalanceResponseMapper(item)),
  };
};

export const AccountBalanceResponseMapper = (
  item: DBAccountBalance,
): AccountBalanceResponse => {
  return {
    accountId: item.accountId,
    balance: item.balance.toString(),
    tokenId: item.tokenId,
    delegate: item.delegate,
  };
};

export const AccountBalanceVariationsRequestSchema = z.object({
  days: z // TODO: change to `fromDate` and `toDate` (TIMESTAMP)
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

export const AccountBalanceVariationsResponseSchema = z.object({
  period: PeriodResponseSchema,
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

export const AccountInteractionsParamsSchema = z.object({
  address: z.string().transform((addr) => toLowerCaseAddress(addr)),
});

export const AccountInteractionsQuerySchema =
  AccountBalanceVariationsRequestSchema.extend({
    minAmount: z
      .string()
      .transform((val) => BigInt(val))
      .optional(),
    maxAmount: z
      .string()
      .transform((val) => BigInt(val))
      .optional(),
    orderBy: z.enum(["volume", "count"]).optional().default("count"),
    filterAddress: z
      .string()
      .transform((addr) => toLowerCaseAddress(addr))
      .optional(),
  });

export const AccountInteractionsResponseSchema = z.object({
  period: PeriodResponseSchema,
  totalCount: z.number(),
  items: z.array(
    z.object({
      accountId: z.string(),
      amountTransferred: z.string(),
      totalVolume: z.string(),
      transferCount: z.string(),
    }),
  ),
});

export type AccountBalanceVariationsResponse = z.infer<
  typeof AccountBalanceVariationsResponseSchema
>;

export type AccountInteractionsResponse = z.infer<
  typeof AccountInteractionsResponseSchema
>;

export type DBAccountBalanceVariation = {
  accountId: Address;
  previousBalance: bigint;
  currentBalance: bigint;
  absoluteChange: bigint;
  percentageChange: number;
};

export type DBAccountInteraction = DBAccountBalanceVariation & {
  totalVolume: bigint;
  transferCount: bigint;
};

export type DBAccountBalance = typeof accountBalance.$inferSelect;

export interface AccountInteractions {
  interactionCount: number;
  interactions: DBAccountInteraction[];
}

export interface DBHistoricalBalance {
  address: Address;
  balance: string;
}

export type HistoricalBalance = DBHistoricalBalance & {
  blockNumber: number;
  tokenAddress: Address;
};

export interface Filter {
  address?: Address;
  minAmount?: bigint;
  maxAmount?: bigint;
}

export const HistoricalBalanceMapper = (
  daoId: DaoIdEnum,
  balances: DBHistoricalBalance[],
  currentBlockNumber: number,
  days: DaysEnum,
): HistoricalBalance[] => {
  const blockNumber = calculateHistoricalBlockNumber(
    days,
    currentBlockNumber,
    CONTRACT_ADDRESSES[daoId].blockTime,
  );

  return balances.map((b) => ({
    ...b,
    blockNumber: blockNumber,
    tokenAddress: CONTRACT_ADDRESSES[daoId].token.address,
  }));
};

export const AccountBalanceVariationsMapper = (
  variations: DBAccountBalanceVariation[],
  endTimestamp: number,
  days: DaysEnum,
): AccountBalanceVariationsResponse => {
  return AccountBalanceVariationsResponseSchema.parse({
    period: PeriodResponseMapper(endTimestamp, days),
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
        percentageChange: previousBalance
          ? percentageChange.toString()
          : PERCENTAGE_NO_BASELINE,
      }),
    ),
  });
};

export const AccountInteractionsMapper = (
  interactions: AccountInteractions,
  endTimestamp: number,
  days: DaysEnum,
): AccountInteractionsResponse => {
  return AccountInteractionsResponseSchema.parse({
    period: PeriodResponseMapper(endTimestamp, days),
    totalCount: interactions.interactionCount,
    items: interactions.interactions.map(
      ({ accountId, absoluteChange, totalVolume, transferCount }) => ({
        accountId: accountId,
        amountTransferred: absoluteChange.toString(),
        totalVolume: totalVolume.toString(),
        transferCount: transferCount.toString(),
      }),
    ),
  });
};
