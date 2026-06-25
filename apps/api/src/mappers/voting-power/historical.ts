import { z } from "@hono/zod-openapi";

import { delegation, votingPowerHistory } from "@/database";

import {
  AddressSchema,
  addressOutputField,
  addressPathParams,
  daoIdField,
  decimalStringField,
  defaultDescOrderDirection,
  inclusiveDateRangeQueryParams,
  logIndexField,
  paginatedListResponse,
  paginationLimitQueryParam,
  paginationSkipQueryParam,
  txHashField,
  unixSecondsStringField,
} from "../shared";
import { DBTransfer } from "../transfers";

type DBDelegation = typeof delegation.$inferSelect;

export type DBHistoricalVotingPower = typeof votingPowerHistory.$inferSelect;
export type DBHistoricalVotingPowerWithRelations = DBHistoricalVotingPower & {
  delegations: DBDelegation | null;
  transfers: DBTransfer | null;
};

export const HistoricalVotingPowerRequestParamsSchema = addressPathParams(
  "HistoricalVotingPowerRequestParams",
  "Path params for historical voting power queries.",
);

export const HistoricalVotingPowerRequestQuerySchema = z
  .object({
    skip: paginationSkipQueryParam(
      "Number of historical voting power rows to skip.",
    ),
    limit: paginationLimitQueryParam(
      "Maximum number of historical voting power rows to return.",
      10,
      1000,
    ),
    orderBy: z
      .enum(["timestamp", "delta"])
      .optional()
      .default("timestamp")
      .openapi({
        description: "Field used to sort historical voting power rows.",
        example: "timestamp",
      }),
    orderDirection: defaultDescOrderDirection(),
    ...inclusiveDateRangeQueryParams("voting power timestamps"),
    fromValue: z.string().optional().openapi({
      description: "Minimum voting power delta encoded as a decimal string.",
    }),
    toValue: z.string().optional().openapi({
      description: "Maximum voting power delta encoded as a decimal string.",
    }),
  })
  .openapi("HistoricalVotingPowerRequestQuery", {
    description:
      "Query params used to page and filter historical voting power deltas.",
  });

export type HistoricalVotingPowerRequest = z.infer<
  typeof HistoricalVotingPowerRequestQuerySchema
>;

export const HistoricalVotingPowerDelegationSchema = z
  .object({
    from: z.string().openapi({ format: "ethereum-address" }),
    value: z.string().openapi({ format: "int64" }),
    to: z.string().openapi({ format: "ethereum-address" }),
    previousDelegate: z
      .string()
      .nullable()
      .openapi({ format: "ethereum-address" }),
  })
  .openapi("HistoricalVotingPowerDelegation", {
    description:
      "Delegation event associated with a historical voting power row.",
  });

export const HistoricalVotingPowerTransferSchema = z
  .object({
    value: z.string().openapi({ format: "int64" }),
    from: z.string().openapi({ format: "ethereum-address" }),
    to: z.string().openapi({ format: "ethereum-address" }),
  })
  .openapi("HistoricalVotingPowerTransfer", {
    description:
      "Transfer event associated with a historical voting power row.",
  });

export const HistoricalVotingPowerResponseSchema = z
  .object({
    transactionHash: txHashField(),
    daoId: daoIdField(),
    accountId: addressOutputField("Account address."),
    votingPower: decimalStringField(
      "Voting power after the event, encoded as a decimal string.",
    ),
    delta: z.string().openapi({
      description: "Voting power change introduced by the event.",
      format: "int64",
    }),
    timestamp: unixSecondsStringField("Event"),
    logIndex: logIndexField(),
    delegation: HistoricalVotingPowerDelegationSchema.nullable(),
    transfer: HistoricalVotingPowerTransferSchema.nullable(),
  })
  .openapi("HistoricalVotingPower", {
    description:
      "Single historical voting power record enriched with delegation and transfer context.",
  });

export const HistoricalVotingPowersResponseSchema = paginatedListResponse(
  HistoricalVotingPowerResponseSchema,
  "Total number of matching historical voting power rows.",
).openapi("HistoricalVotingPowersResponse", {
  description: "Paginated historical voting power records.",
});

export type HistoricalVotingPowerResponse = z.infer<
  typeof HistoricalVotingPowerResponseSchema
>;

export type HistoricalVotingPowersResponse = z.infer<
  typeof HistoricalVotingPowersResponseSchema
>;

export const HistoricalVotingPowerResponseMapper = (
  p: DBHistoricalVotingPowerWithRelations,
): HistoricalVotingPowerResponse => {
  return {
    transactionHash: p.transactionHash,
    daoId: p.daoId,
    accountId: p.accountId,
    votingPower: p.votingPower.toString(),
    delta: p.delta.toString(),
    timestamp: p.timestamp.toString(),
    logIndex: p.logIndex,
    delegation: p.delegations
      ? {
          from: p.delegations.delegatorAccountId,
          value: p.delegations.delegatedValue.toString(),
          to: p.delegations.delegateAccountId,
          previousDelegate: p.delegations.previousDelegate,
        }
      : null,
    transfer: p.transfers
      ? {
          value: p.transfers.amount.toString(),
          from: p.transfers.fromAccountId,
          to: p.transfers.toAccountId,
        }
      : null,
  };
};

export const HistoricalVotingPowersResponseMapper = (
  p: DBHistoricalVotingPowerWithRelations[],
  totalCount: number,
): HistoricalVotingPowersResponse => {
  return {
    items: p.map(HistoricalVotingPowerResponseMapper),
    totalCount: Number(totalCount),
  };
};

export const HistoricalVotingPowerGlobalQuerySchema =
  HistoricalVotingPowerRequestQuerySchema.extend({
    address: AddressSchema.openapi({
      description:
        "Optional account address used to scope the historical voting power results.",
    }).optional(),
  }).openapi("HistoricalVotingPowerGlobalQuery", {
    description:
      "Global historical voting power filters, optionally scoped to a single address.",
  });
