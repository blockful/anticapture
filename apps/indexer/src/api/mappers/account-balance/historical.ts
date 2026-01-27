import { z } from "@hono/zod-openapi";
import { balanceHistory } from "ponder:schema";
import { getAddress, isAddress } from "viem";
import { DBTransfer } from "../transfers";

export type DBHistoricalBalance = typeof balanceHistory.$inferSelect;
export type DBHistoricalBalanceWithRelations = DBHistoricalBalance & {
  transfer: DBTransfer;
};

export const HistoricalBalanceRequestParamsSchema = z.object({
  address: z
    .string()
    .refine((addr) => isAddress(addr))
    .transform((addr) => getAddress(addr))
});

export const HistoricalBalanceRequestQuerySchema = z.object({
  skip: z.coerce
    .number()
    .int()
    .min(0, "Skip must be a non-negative integer")
    .optional()
    .default(0),
  limit: z.coerce
    .number()
    .int()
    .min(1, "Limit must be a positive integer")
    .max(1000, "Limit cannot exceed 1000")
    .optional()
    .default(10),
  orderBy: z.enum(["timestamp", "delta"]).optional().default("timestamp"),
  orderDirection: z.enum(["asc", "desc"]).optional().default("desc"),
  fromDate: z
    .string()
    .transform((val) => Number(val))
    .optional(),
  toDate: z
    .string()
    .transform((val) => Number(val))
    .optional(),
  fromValue: z.string().optional(),
  toValue: z.string().optional(),
});

export type HistoricalBalanceRequest = z.infer<
  typeof HistoricalBalanceRequestQuerySchema
>;

export const HistoricalBalanceResponseSchema = z.object({
  transactionHash: z.string(),
  daoId: z.string(),
  accountId: z.string(),
  balance: z.string(),
  delta: z.string(),
  timestamp: z.string(),
  logIndex: z.number(),
  transfer: z.object({
    value: z.string(),
    from: z.string(),
    to: z.string(),
  }),
});

export const HistoricalBalancesResponseSchema = z.object({
  items: z.array(HistoricalBalanceResponseSchema),
  totalCount: z.number(),
});

export type HistoricalBalanceResponse = z.infer<
  typeof HistoricalBalanceResponseSchema
>;

export type HistoricalBalancesResponse = z.infer<
  typeof HistoricalBalancesResponseSchema
>;

export const HistoricalBalanceResponseMapper = (
  value: DBHistoricalBalanceWithRelations,
): HistoricalBalanceResponse => {
  return {
    transactionHash: value.transactionHash,
    daoId: value.daoId,
    accountId: value.accountId,
    balance: value.balance.toString(),
    delta: value.delta.toString(),
    timestamp: value.timestamp.toString(),
    logIndex: value.logIndex,
    transfer: {
      value: value.transfer.amount.toString(),
      from: value.transfer.fromAccountId,
      to: value.transfer.toAccountId,
    },
  };
};

export const HistoricalBalancesResponseMapper = (
  values: DBHistoricalBalanceWithRelations[],
  totalCount: number,
): HistoricalBalancesResponse => {
  return {
    items: values.map(HistoricalBalanceResponseMapper),
    totalCount: Number(totalCount),
  };
};
