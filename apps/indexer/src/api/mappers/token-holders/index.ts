import { z } from "@hono/zod-openapi";
import { Address, isAddress } from "viem";
import { DaysEnum, DaysOpts } from "@/lib/enums";
import { PERCENTAGE_NO_BASELINE } from "@/api/mappers/constants";

// ============================================================================
// Request Schema
// ============================================================================

export const TokenHoldersRequestSchema = z.object({
  days: z
    .enum(DaysOpts)
    .optional()
    .default("90d")
    .transform((val) => DaysEnum[val]),
  orderBy: z.enum(["balance", "variation"]).optional().default("balance"),
  orderDirection: z.enum(["asc", "desc"]).optional().default("desc"),
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
  address: z
    .string()
    .optional()
    .transform((addr) =>
      addr ? (isAddress(addr) ? addr.toLowerCase() : undefined) : undefined,
    ),
  delegate: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      if (val.toLowerCase() === "nonzero") return "nonzero";
      return isAddress(val) ? val.toLowerCase() : undefined;
    }),
});

// ============================================================================
// Response Schema
// ============================================================================

export const TokenHoldersResponseSchema = z.object({
  period: z.object({
    days: z.string(),
    startTimestamp: z.string(),
    endTimestamp: z.string(),
  }),
  totalCount: z.number(),
  items: z.array(
    z.object({
      accountId: z.string(),
      balance: z.string(),
      delegate: z.string(),
      variation: z.string(),
      percentageChange: z.string(),
    }),
  ),
});

// ============================================================================
// Types
// ============================================================================

export type TokenHoldersRequest = z.infer<typeof TokenHoldersRequestSchema>;
export type TokenHoldersResponse = z.infer<typeof TokenHoldersResponseSchema>;

export interface DBTokenHolder {
  accountId: Address;
  balance: bigint;
  delegate: Address;
  variation: bigint;
}

export interface TokenHoldersResult {
  totalCount: number;
  items: DBTokenHolder[];
}

export interface TokenHoldersFilter {
  address?: Address;
  delegate?: "nonzero" | Address;
}

// ============================================================================
// Mapper
// ============================================================================

export const TokenHoldersMapper = (
  result: TokenHoldersResult,
  endTimestamp: number,
  days: DaysEnum,
): TokenHoldersResponse => {
  return TokenHoldersResponseSchema.parse({
    period: {
      days: DaysEnum[days] as string,
      startTimestamp: new Date((endTimestamp - days) * 1000).toISOString(),
      endTimestamp: new Date(endTimestamp * 1000).toISOString(),
    },
    totalCount: result.totalCount,
    items: result.items.map(({ accountId, balance, delegate, variation }) => {
      const previousBalance = balance - variation;
      const percentageChange = previousBalance
        ? Number((variation * 10000n) / previousBalance) / 100
        : 0;

      return {
        accountId: accountId,
        balance: balance.toString(),
        delegate: delegate,
        variation: variation.toString(),
        percentageChange: previousBalance
          ? percentageChange.toString()
          : PERCENTAGE_NO_BASELINE,
      };
    }),
  });
};
