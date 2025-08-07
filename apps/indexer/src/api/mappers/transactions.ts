import { z } from "@hono/zod-openapi";
import { transaction, transfer, delegation } from "ponder:schema";
import { isAddress } from "viem";

export type DBTransaction = typeof transaction.$inferSelect & {
  delegations: DBDelegation[];
  transfers: DBTransfer[];
};
export type DBTransfer = typeof transfer.$inferSelect;
export type DBDelegation = typeof delegation.$inferSelect;

export const AffectedSupplyEnum = z.enum(["CEX", "DEX", "LENDING", "TOTAL"]);

export type AffectedSupply = z.infer<typeof AffectedSupplyEnum>;

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
  from: z
    .string()
    .refine((addr) => addr && isAddress(addr))
    .optional(),
  to: z
    .string()
    .refine((addr) => addr && isAddress(addr))
    .optional(),
  minAmount: z.coerce.number().optional(),
  maxAmount: z.coerce.number().optional(),
  affectedSupply: z.array(AffectedSupplyEnum).optional(),
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
  isCex: z.boolean(),
  isDex: z.boolean(),
  isLending: z.boolean(),
  isTotal: z.boolean(),
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
  isCex: z.boolean(),
  isDex: z.boolean(),
  isLending: z.boolean(),
  isTotal: z.boolean(),
});

export const TransactionResponseSchema = z.object({
  transactionHash: z.string(),
  from: z.string().nullable(),
  to: z.string().nullable(),
  isCex: z.boolean(),
  isDex: z.boolean(),
  isLending: z.boolean(),
  isTotal: z.boolean(),
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
      transactionHash: t.transactionHash,
      daoId: t.daoId,
      tokenId: t.tokenId,
      amount: t.amount,
      fromAccountId: t.fromAccountId,
      toAccountId: t.toAccountId,
      timestamp: t.timestamp,
      logIndex: t.logIndex,
      isCex: t.isCex,
      isDex: t.isDex,
      isLending: t.isLending,
      isTotal: t.isTotal,
    };
  },

  delegationToApi: (d: DBDelegation): DelegationResponse => {
    return {
      transactionHash: d.transactionHash,
      daoId: d.daoId,
      delegateAccountId: d.delegateAccountId,
      delegatorAccountId: d.delegatorAccountId,
      delegatedValue: d.delegatedValue,
      previousDelegate: d.previousDelegate,
      timestamp: d.timestamp.toString(),
      logIndex: d.logIndex.toString(),
      isCex: d.isCex,
      isDex: d.isDex,
      isLending: d.isLending,
      isTotal: d.isTotal,
    };
  },

  toApi: (
    t: DBTransaction,
    transfers: DBTransfer[],
    delegations: DBDelegation[],
  ): TransactionResponse => {
    return {
      transactionHash: t.transactionHash,
      from: t.fromAddress,
      to: t.toAddress,
      isCex: t.isCex,
      isDex: t.isDex,
      isLending: t.isLending,
      isTotal: t.isTotal,
      timestamp: t.timestamp.toString(),
      transfers: transfers.map(TransactionMapper.transferToApi),
      delegations: delegations.map(TransactionMapper.delegationToApi),
    };
  },
};
