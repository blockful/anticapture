import { z } from "@hono/zod-openapi";
import { getAddress, isAddress } from "viem";

import { transaction } from "@/database";

import { DBDelegation } from "../delegations";
import {
  DBTransfer,
  TransferMapper,
  TransferResponseSchema,
} from "../transfers";
import { normalizeQueryArray, OrderDirectionSchema } from "../shared";

export type DBTransaction = typeof transaction.$inferSelect & {
  transfers: DBTransfer[];
  delegations: DBDelegation[];
};

export enum AffectedSupply {
  CEX = "CEX",
  DEX = "DEX",
  LENDING = "LENDING",
  TOTAL = "TOTAL",
  UNASSIGNED = "UNASSIGNED",
}

export enum TransactionType {
  TRANSFER = "TRANSFER",
  DELEGATION = "DELEGATION",
}

const AffectedSupplyListSchema = z
  .array(z.nativeEnum(AffectedSupply))
  .openapi("AffectedSupplyList");

const TransactionIncludeListSchema = z
  .array(z.nativeEnum(TransactionType))
  .openapi("TransactionIncludeList");

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
    orderDirection: OrderDirectionSchema.optional().default("desc"),
    fromDate: z.coerce.number().int("fromDate must be an integer").optional(),
    toDate: z.coerce.number().int("toDate must be an integer").optional(),
    from: z
      .string()
      .refine((addr) => isAddress(addr, { strict: false }))
      .transform((addr) => getAddress(addr))
      .optional(),
    to: z
      .string()
      .refine((addr) => isAddress(addr, { strict: false }))
      .transform((addr) => getAddress(addr))
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
      .preprocess(normalizeQueryArray, AffectedSupplyListSchema.optional())
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
          isUnassigned: affectedSupply.includes(AffectedSupply.UNASSIGNED),
        };
      }),
    includes: z
      .preprocess(normalizeQueryArray, TransactionIncludeListSchema.optional())
      .optional()
      .describe(
        "Filter by transaction type. Can be one of: 'TRANSFER', 'DELEGATION'",
      )
      .transform((includeTypes) => {
        if (!includeTypes?.length)
          return {
            transfers: true,
            delegations: true,
          };

        return {
          transfers: includeTypes.includes(TransactionType.TRANSFER),
          delegations: includeTypes.includes(TransactionType.DELEGATION),
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
  )
  .openapi("TransactionsRequest", {
    description:
      "Query params used to page and filter transactions with transfer and delegation context.",
  });

export type TransactionsRequest = z.infer<typeof TransactionsRequestSchema>;

export const DelegationResponseSchema = z
  .object({
    transactionHash: z.string(),
    daoId: z.string(),
    delegateAccountId: z.string(),
    delegatorAccountId: z.string(),
    delegatedValue: z.string(),
    previousDelegate: z.string().nullable(),
    timestamp: z.string(),
    logIndex: z.number().int(),
    isCex: z.boolean(),
    isDex: z.boolean(),
    isLending: z.boolean(),
    isTotal: z.boolean(),
  })
  .openapi("TransactionDelegation", {
    description: "Delegation event embedded within a transaction response.",
  });

export const TransactionResponseSchema = z
  .object({
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
  })
  .openapi("Transaction", {
    description:
      "Transaction response enriched with transfer and delegation events.",
  });

export const TransactionsResponseSchema = z
  .object({
    items: z.array(TransactionResponseSchema),
    totalCount: z.number().int(),
  })
  .openapi("TransactionsResponse", {
    description:
      "Paginated transactions with embedded transfer and delegation data.",
  });

export type TransactionsResponse = z.infer<typeof TransactionsResponseSchema>;
export type TransactionResponse = z.infer<typeof TransactionResponseSchema>;
export type DelegationResponse = z.infer<typeof DelegationResponseSchema>;

export const TransactionMapper = {
  delegationToApi: (d: DBDelegation): DelegationResponse => {
    return {
      transactionHash: d.transactionHash,
      daoId: d.daoId,
      delegateAccountId: d.delegateAccountId,
      delegatorAccountId: d.delegatorAccountId,
      delegatedValue: d.delegatedValue.toString(),
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
      transfers: t.transfers.map(TransferMapper.toApi),
      delegations: t.delegations.map(TransactionMapper.delegationToApi),
    };
  },
};
