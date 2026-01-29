import { z } from "@hono/zod-openapi";
import { accountBalance } from "@/database";
import { Address, getAddress, isAddress } from "viem";

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
    address: item.accountId,
    balance: item.balance.toString(),
    tokenId: item.tokenId,
    delegate: item.delegate,
  };
};

export type DBAccountBalance = typeof accountBalance.$inferSelect;

export interface Filter {
  address?: Address;
  minAmount?: bigint;
  maxAmount?: bigint;
}
