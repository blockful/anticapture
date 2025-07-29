import { z } from "@hono/zod-openapi";
import { transaction, transfer, delegation } from "ponder:schema";

export type DBTransaction = typeof transaction.$inferSelect;
export type DBTransfer = typeof transfer.$inferSelect;
export type DBDelegation = typeof delegation.$inferSelect;

export const TransactionsRequestSchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .min(1, "Limit must be a positive integer")
    .max(100, "Limit cannot exceed 100")
    .default(50)
    .optional(),
  offset: z.coerce
    .number()
    .int()
    .min(0, "Offset must be a non-negative integer")
    .default(0)
    .optional(),
  sortBy: z.enum(["timestamp"]).default("timestamp").optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc").optional(),
  fromAddress: z.string().optional(),
  toAddress: z.string().optional(),
});

export type TransactionsRequest = z.infer<typeof TransactionsRequestSchema>;

export const TransferResponseSchema = z.object({
  transactionHash: z.string(),
  daoId: z.string(),
  tokenId: z.string(),
  amount: z.string(),
  fromAccountId: z.string(),
  toAccountId: z.string(),
  timestamp: z.string(),
});

export const DelegationResponseSchema = z.object({
  transactionHash: z.string(),
  daoId: z.string(),
  delegateAccountId: z.string(),
  delegatorAccountId: z.string(),
  delegatedValue: z.string(),
  previousDelegate: z.string().nullable(),
  timestamp: z.string(),
});

export const TransactionResponseSchema = z.object({
  transactionHash: z.string(),
  fromAddress: z.string().nullable(),
  toAddress: z.string().nullable(),
  isCex: z.boolean(),
  isDex: z.boolean(),
  isLending: z.boolean(),
  isTreasury: z.boolean(),
  isBurning: z.boolean(),
  isTotal: z.boolean(),
  isCirculating: z.boolean(),
  timestamp: z.string(),
  transfers: z.array(TransferResponseSchema),
  delegations: z.array(DelegationResponseSchema),
});

export const TransactionsResponseSchema = z.object({
  transactions: z.array(TransactionResponseSchema),
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
});

export type TransactionsResponse = z.infer<typeof TransactionsResponseSchema>;
export type TransactionResponse = z.infer<typeof TransactionResponseSchema>;
export type TransferResponse = z.infer<typeof TransferResponseSchema>;
export type DelegationResponse = z.infer<typeof DelegationResponseSchema>;

export const TransactionMapper = {
  transferToApi: (t: DBTransfer): TransferResponse => {
    return {
      transactionHash: t.transactionHash || "",
      daoId: t.daoId || "",
      tokenId: t.tokenId || "",
      amount: (t.amount || 0n).toString(),
      fromAccountId: t.fromAccountId || "",
      toAccountId: t.toAccountId || "",
      timestamp: (t.timestamp || 0n).toString(),
    };
  },

  delegationToApi: (d: DBDelegation): DelegationResponse => {
    return {
      transactionHash: d.transactionHash || "",
      daoId: d.daoId || "",
      delegateAccountId: d.delegateAccountId || "",
      delegatorAccountId: d.delegatorAccountId || "",
      delegatedValue: (d.delegatedValue || 0n).toString(),
      previousDelegate: d.previousDelegate,
      timestamp: (d.timestamp || 0n).toString(),
    };
  },

  toApi: (t: DBTransaction, transfers: DBTransfer[], delegations: DBDelegation[]): TransactionResponse => {
    return {
      transactionHash: t.transactionHash,
      fromAddress: t.fromAddress,
      toAddress: t.toAddress,
      isCex: t.isCex,
      isDex: t.isDex,
      isLending: t.isLending,
      isTreasury: t.isTreasury,
      isBurning: t.isBurning,
      isTotal: t.isTotal,
      isCirculating: t.isCirculating,
      timestamp: t.timestamp.toString(),
      transfers: transfers.map(TransactionMapper.transferToApi),
      delegations: delegations.map(TransactionMapper.delegationToApi),
    };
  },
};
