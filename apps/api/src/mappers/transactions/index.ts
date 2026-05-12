import { z } from "@hono/zod-openapi";

import { transaction } from "@/database";

import { DBDelegation } from "../delegations";
import {
  DBTransfer,
  TransferMapper,
  TransferResponseSchema,
} from "../transfers";
import {
  AddressSchema,
  addressOutputField,
  affectedSupplyFlagsFields,
  commaDelimitedEnumQueryParam,
  daoIdField,
  decimalStringField,
  defaultDescOrderDirection,
  inclusiveDateRangeQueryParams,
  logIndexField,
  paginatedListResponse,
  paginationQueryParams,
  txHashField,
  unixSecondsStringField,
} from "../shared";

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

const AffectedSupplyListSchema = commaDelimitedEnumQueryParam(
  Object.values(AffectedSupply) as [AffectedSupply, ...AffectedSupply[]],
);

const TransactionIncludeListSchema = commaDelimitedEnumQueryParam(
  Object.values(TransactionType) as [TransactionType, ...TransactionType[]],
);

export const TransactionsRequestSchema = z
  .object({
    ...paginationQueryParams(),
    orderDirection: defaultDescOrderDirection(),
    ...inclusiveDateRangeQueryParams("transaction timestamps"),
    from: AddressSchema.optional(),
    to: AddressSchema.optional(),
    minAmount: z
      .string()
      .transform((val) => BigInt(val))
      .optional(), //z.coerce.bigint().optional() doesn't work because of a bug with zod, zod asks for a string that satisfies REGEX ^d+$, when it should be ^\d+$
    maxAmount: z
      .string()
      .transform((val) => BigInt(val))
      .optional(), //z.coerce.bigint().optional() doesn't work because of a bug with zod, zod asks for a string that satisfies REGEX ^d+$, when it should be ^\d+$
    affectedSupply: AffectedSupplyListSchema.optional()
      .openapi({
        type: "array",
        items: {
          type: "string",
          enum: ["CEX", "DEX", "LENDING", "TOTAL", "UNASSIGNED"],
        },
        description:
          "Filter transactions by affected supply type. Can be: 'CEX', 'DEX', 'LENDING', or 'TOTAL'",
      })
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
    includes: TransactionIncludeListSchema.optional()
      .openapi({
        type: "array",
        items: {
          type: "string",
          enum: ["TRANSFER", "DELEGATION"],
        },
        description:
          "Filter by transaction type. Can be one of: 'TRANSFER', 'DELEGATION'",
      })
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
    transactionHash: txHashField(),
    daoId: daoIdField(),
    delegateAccountId: addressOutputField("Delegate address."),
    delegatorAccountId: z
      .string()
      .openapi({ description: "Delegator address." }),
    delegatedValue: decimalStringField(
      "Delegated amount encoded as a decimal string.",
    ),
    previousDelegate: z.string().nullable().openapi({
      description: "Previous delegate address, if one existed.",
    }),
    timestamp: unixSecondsStringField("Delegation"),
    logIndex: logIndexField(),
    ...affectedSupplyFlagsFields("delegation"),
  })
  .openapi("TransactionDelegation", {
    description: "Delegation event embedded within a transaction response.",
  });

export const TransactionResponseSchema = z
  .object({
    transactionHash: txHashField(),
    from: z.string().nullable().openapi({
      description: "Resolved sender address, if known.",
    }),
    to: z.string().nullable().openapi({
      description: "Resolved recipient address, if known.",
    }),
    ...affectedSupplyFlagsFields("transaction"),
    timestamp: unixSecondsStringField("Transaction"),
    transfers: z.array(TransferResponseSchema),
    delegations: z.array(DelegationResponseSchema),
  })
  .openapi("Transaction", {
    description:
      "Transaction response enriched with transfer and delegation events.",
  });

export const TransactionsResponseSchema = paginatedListResponse(
  TransactionResponseSchema,
  "Total number of matching transactions.",
).openapi("TransactionsResponse", {
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
