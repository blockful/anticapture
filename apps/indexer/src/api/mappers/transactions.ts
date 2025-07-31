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
  from: z.string().optional(),
  to: z.string().optional(),
  minVolume: z.coerce.number().optional(),
  maxVolume: z.coerce.number().optional(),
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
  logIndex: z.string().nullable(),
});

export const DelegationResponseSchema = z.object({
  transactionHash: z.string(),
  daoId: z.string(),
  delegateAccountId: z.string(),
  delegatorAccountId: z.string(),
  delegatedValue: z.string(),
  previousDelegate: z.string().nullable(),
  timestamp: z.string(),
  logIndex: z.string().nullable(),
});

export const TransactionResponseSchema = z.object({
  transactionHash: z.string(),
  from: z.string().nullable(),
  to: z.string().nullable(),
  volume: z.string(),
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
      logIndex: t.logIndex !== null && t.logIndex !== undefined ? t.logIndex.toString() : null,
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
      logIndex: d.logIndex !== null && d.logIndex !== undefined ? d.logIndex.toString() : null,
    };
  },

  toApi: (t: DBTransaction, transfers: DBTransfer[], delegations: DBDelegation[]): TransactionResponse => {
    // Calculate volume based on transfers and delegations
    let volume = 0n;
    
    // If there are transfers, sum their amounts
    if (transfers.length > 0) {
      volume = transfers.reduce((sum, transfer) => sum + (transfer.amount || 0n), 0n);
    } else if (delegations.length > 0) {
      // If only delegations, sum positive delegation amounts
      volume = delegations.reduce((sum, delegation) => {
        const delegatedValue = delegation.delegatedValue || 0n;
        // Only add positive values (ignore negative or zero)
        return delegatedValue > 0n ? sum + delegatedValue : sum;
      }, 0n);
    }

    return {
      transactionHash: t.transactionHash,
      from: t.fromAddress,
      to: t.toAddress,
      volume: volume.toString(),
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
