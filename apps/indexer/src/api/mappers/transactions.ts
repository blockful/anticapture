import { transfer, delegation, transaction } from "ponder:schema";
import { formatEther, isAddress } from "viem";
import { z } from "@hono/zod-openapi";

export type DBTransaction = typeof transaction.$inferSelect & {
  transfers: DBTransfer[];
  delegations: DBDelegation[];
};

export type DBTransfer = typeof transfer.$inferSelect;
export type DBDelegation = typeof delegation.$inferSelect;

export enum AffectedSupply {
  CEX = "CEX",
  DEX = "DEX",
  LENDING = "LENDING",
  TOTAL = "TOTAL",
}

export const TransactionsRequestSchema = z
  .object({
    limit: z.coerce
      .number()
      .int()
      .min(1, "Limit must be a positive integer")
      .max(100, "Limit cannot exceed 100")
      .optional()
      .default(50),
    offset: z.coerce
      .number()
      .int()
      .min(0, "Offset must be a non-negative integer")
      .optional()
      .default(0),
    sortBy: z.enum(["timestamp"]).optional().default("timestamp"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
    fromDate: z.coerce.number().int("fromDate must be an integer").optional(),
    toDate: z.coerce.number().int("toDate must be an integer").optional(),
    from: z
      .string()
      .refine((addr) => isAddress(addr))
      .optional(),
    to: z
      .string()
      .refine((addr) => isAddress(addr))
      .optional(),
    minAmount: z
      .string()
      .transform((val) => BigInt(val))
      .optional(), //z.coerce.bigint().optional() doesn't work because of a bug with zod, zod asks for a string that satisfies REGEX ^d+$, when it should be ^\d+$
    maxAmount: z
      .string()
      .transform((val) => BigInt(val))
      .optional(), //z.coerce.bigint().optional() doesn't work because of a bug with zod, zod asks for a string that satisfies REGEX ^d+$, when it should be ^\d+$
    affectedSupply: z
      .union([
        z.nativeEnum(AffectedSupply),
        z.array(z.nativeEnum(AffectedSupply)),
      ])
      .optional()
      .describe(
        "Filter transactions by affected supply type. Can be: 'CEX', 'DEX', 'LENDING', or 'TOTAL'",
      )
      .transform((affectedSupply) => {
        if (!affectedSupply?.length) return {};

        return {
          isCex: affectedSupply.includes(AffectedSupply.CEX),
          isDex: affectedSupply.includes(AffectedSupply.DEX),
          isLending: affectedSupply.includes(AffectedSupply.LENDING),
          isTotal: affectedSupply.includes(AffectedSupply.TOTAL),
        };
      }),
  })
  .refine(
    (data) => {
      if (data.fromDate && data.toDate) {
        return data.fromDate <= data.toDate;
      }
      return true;
    },
    {
      message: "fromDate must be less than or equal to toDate",
      path: ["fromDate"],
    },
  );

export type TransactionsRequest = z.infer<typeof TransactionsRequestSchema>;

export const TransferResponseSchema = z.object({
  transactionHash: z.string(),
  daoId: z.string(),
  tokenId: z.string(),
  amount: z.string(),
  fromAccountId: z.string(),
  toAccountId: z.string(),
  timestamp: z.string(),
  logIndex: z.number(),
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
  logIndex: z.number(),
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
      amount: formatEther(t.amount),
      fromAccountId: t.fromAccountId,
      toAccountId: t.toAccountId,
      timestamp: t.timestamp.toString(),
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
      delegatedValue: formatEther(d.delegatedValue),
      previousDelegate: d.previousDelegate,
      timestamp: d.timestamp.toString(),
      logIndex: d.logIndex,
      isCex: d.isCex,
      isDex: d.isDex,
      isLending: d.isLending,
      isTotal: d.isTotal,
    };
  },

  toApi: (t: DBTransaction): TransactionResponse => {
    return {
      transactionHash: t.transactionHash,
      from: t.fromAddress,
      to: t.toAddress,
      isCex: t.isCex,
      isDex: t.isDex,
      isLending: t.isLending,
      isTotal: t.isTotal,
      timestamp: t.timestamp.toString(),
      transfers: t.transfers.map(TransactionMapper.transferToApi),
      delegations: t.delegations.map(TransactionMapper.delegationToApi),
    };
  },
};
