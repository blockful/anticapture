import { DaoIdEnum, DaysEnum, DaysOpts } from "@/lib/enums";
import { z } from "@hono/zod-openapi";
import { Address, isAddress } from "viem";
import { PERCENTAGE_NO_BASELINE } from "@/api/mappers/constants";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { calculateHistoricalBlockNumber } from "@/lib/blockTime";

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
      z
        .string()
        .refine(isAddress, "Invalid address")
        .transform((addr) => [addr]),
      z.array(z.string().refine(isAddress, "Invalid addresses")),
    ])
    .optional()
    .transform((val) => (val === undefined ? [] : val)),
  delegates: z
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

export const AccountBalanceVariationsResponseSchema = z.object({
  period: z.object({
    days: z.string(),
    startTimestamp: z.string(),
    endTimestamp: z.string(),
  }),
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

export const AccountInteractionsRequestSchema =
  AccountBalanceVariationsRequestSchema.extend({
    accountId: z.string(),
    minAmount: z
      .string()
      .transform((val) => BigInt(val))
      .optional(), //z.coerce.bigint().optional() doesn't work because of a bug with zod, zod asks for a string that satisfies REGEX ^d+$, when it should be ^\d+$
    maxAmount: z
      .string()
      .transform((val) => BigInt(val))
      .optional(), //z.coerce.bigint().optional() doesn't work because of a bug with zod, zod asks for a string that satisfies REGEX ^d+$, when it should be ^\d+$
    orderBy: z.enum(["volume", "count"]).optional().default("count"),
    address: z
      .string()
      .optional()
      .transform((addr) =>
        addr ? (isAddress(addr) ? addr : undefined) : undefined,
      ),
  });

export const AccountInteractionsResponseSchema = z.object({
  period: z.object({
    days: z.string(),
    startTimestamp: z.string(),
    endTimestamp: z.string(),
  }),
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

export type DBAccountBalance = {
  accountId: Address;
  delegate: string;
  tokenId: string;
  balance: bigint;
};

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
    period: {
      days: DaysEnum[days] as string,
      startTimestamp: new Date((endTimestamp - days) * 1000).toISOString(),
      endTimestamp: new Date(endTimestamp * 1000).toISOString(),
    },
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
    period: {
      days: DaysEnum[days] as string,
      startTimestamp: new Date((endTimestamp - days) * 1000).toISOString(),
      endTimestamp: new Date(endTimestamp * 1000).toISOString(),
    },
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
