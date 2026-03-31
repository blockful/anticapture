import { z } from "@hono/zod-openapi";

import { delegation, votingPowerHistory } from "@/database";

import {
  AddressSchema,
  OrderDirectionSchema,
  paginationLimitQueryParam,
  paginationSkipQueryParam,
  unixTimestampQueryParam,
} from "../shared";
import { DBTransfer } from "../transfers";

type DBDelegation = typeof delegation.$inferSelect;

export type DBHistoricalVotingPower = typeof votingPowerHistory.$inferSelect;
export type DBHistoricalVotingPowerWithRelations = DBHistoricalVotingPower & {
  delegations: DBDelegation | null;
  transfers: DBTransfer | null;
};

export const HistoricalVotingPowerRequestParamsSchema = z
  .object({
    address: AddressSchema,
  })
  .openapi("HistoricalVotingPowerRequestParams", {
    description: "Path params for historical voting power queries.",
  });

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
    orderDirection: OrderDirectionSchema.optional().default("desc"),
    fromDate: unixTimestampQueryParam(
      "Inclusive lower bound for voting power timestamps, in Unix seconds.",
    ),
    toDate: unixTimestampQueryParam(
      "Inclusive upper bound for voting power timestamps, in Unix seconds.",
    ),
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
    from: z.string(),
    value: z.string(),
    to: z.string(),
    previousDelegate: z.string().nullable(),
  })
  .openapi("HistoricalVotingPowerDelegation", {
    description:
      "Delegation event associated with a historical voting power row.",
  });

export const HistoricalVotingPowerTransferSchema = z
  .object({
    value: z.string(),
    from: z.string(),
    to: z.string(),
  })
  .openapi("HistoricalVotingPowerTransfer", {
    description:
      "Transfer event associated with a historical voting power row.",
  });

export const HistoricalVotingPowerResponseSchema = z
  .object({
    transactionHash: z.string().openapi({ description: "Transaction hash." }),
    daoId: z.string().openapi({ description: "DAO identifier." }),
    accountId: z.string().openapi({ description: "Account address." }),
    votingPower: z.string().openapi({
      description: "Voting power after the event, encoded as a decimal string.",
    }),
    delta: z.string().openapi({
      description: "Voting power change introduced by the event.",
    }),
    timestamp: z.string().openapi({
      description: "Event timestamp in Unix seconds as a string.",
      example: "1704067200",
    }),
    logIndex: z.number().int().openapi({
      description: "Log index within the transaction receipt.",
    }),
    delegation: HistoricalVotingPowerDelegationSchema.nullable(),
    transfer: HistoricalVotingPowerTransferSchema.nullable(),
  })
  .openapi("HistoricalVotingPower", {
    description:
      "Single historical voting power record enriched with delegation and transfer context.",
  });

export const HistoricalVotingPowersResponseSchema = z
  .object({
    items: z.array(HistoricalVotingPowerResponseSchema),
    totalCount: z.number().int().openapi({
      description: "Total number of matching historical voting power rows.",
    }),
  })
  .openapi("HistoricalVotingPowersResponse", {
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
