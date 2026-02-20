import { z } from "@hono/zod-openapi";
import { accountBalance } from "@/database";
import { Address, getAddress, isAddress } from "viem";

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

export const AccountBalanceResponseSchema = z.object({
  address: z.string(),
  balance: z.string(),
  tokenId: z.string(),
  delegate: z.string(),
});

export const AccountBalanceWithVariationResponseSchema = z.object({
  address: z.string(),
  balance: z.string(),
  previousBalance: z.string(),
  tokenId: z.string(),
  delegate: z.string(),
  absoluteChange: z.string(),
  percentageChange: z.string(),
});

export const AccountBalancesWithVariationResponseSchema = z.object({
  items: z.array(AccountBalanceWithVariationResponseSchema),
  totalCount: z.number(),
});

export type AccountBalanceResponse = z.infer<
  typeof AccountBalanceResponseSchema
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
): AccountBalancesWithVariationResponse => {
  return {
    totalCount: Number(totalCount),
    items: items.map((item) => AccountBalanceWithVariationResponseMapper(item)),
  };
};

export const AccountBalanceWithVariationResponseMapper = (
  item: DBAccountBalanceWithVariation,
): AccountBalanceWithVariationResponse => {
  return {
    address: item.accountId,
    balance: item.currentBalance.toString(),
    tokenId: item.tokenId,
    absoluteChange: item.absoluteChange.toString(),
    delegate: item.delegate,
    percentageChange: item.percentageChange,
    previousBalance: item.previousBalance.toString()
  };
};

export const AccountBalanceResponseMapper = (
  item: DBAccountBalance,
): AccountBalanceResponse => {
  return {
    address: item.accountId,
    balance: item.balance.toString(),
    tokenId: item.tokenId,
    delegate: item.delegate,
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
