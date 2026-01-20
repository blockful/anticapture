import { calculateHistoricalBlockNumber } from "@/lib/blockTime";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { DaoIdEnum, DaysEnum } from "@/lib/enums";
import { z } from "@hono/zod-openapi";
import { accountBalance } from "ponder:schema";
import { Address, isAddress } from "viem";

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

export type DBAccountBalance = typeof accountBalance.$inferSelect;

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
