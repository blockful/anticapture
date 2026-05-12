import { z } from "@hono/zod-openapi";

import { balanceHistory } from "@/database";

import {
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

export type DBHistoricalBalance = typeof balanceHistory.$inferSelect;
export type DBHistoricalBalanceWithRelations = DBHistoricalBalance & {
  transfer: DBTransfer;
};

export const HistoricalBalanceRequestParamsSchema = addressPathParams(
  "HistoricalBalanceRequestParams",
  "Path params for historical balance queries.",
);

export const HistoricalBalanceRequestQuerySchema = z
  .object({
    skip: paginationSkipQueryParam(
      "Number of historical balance rows to skip.",
    ),
    limit: paginationLimitQueryParam(
      "Maximum number of historical balance rows to return.",
      10,
      1000,
    ),
    orderBy: z
      .enum(["timestamp", "delta"])
      .optional()
      .default("timestamp")
      .openapi({
        description: "Field used to sort historical balance rows.",
        example: "timestamp",
      }),
    orderDirection: defaultDescOrderDirection(),
    ...inclusiveDateRangeQueryParams("historical balance timestamps"),
    fromValue: z.string().optional().openapi({
      description: "Minimum balance delta encoded as a decimal string.",
    }),
    toValue: z.string().optional().openapi({
      description: "Maximum balance delta encoded as a decimal string.",
    }),
  })
  .openapi("HistoricalBalanceRequestQuery", {
    description:
      "Query params used to page and filter historical balance deltas.",
  });

export type HistoricalBalanceRequest = z.infer<
  typeof HistoricalBalanceRequestQuerySchema
>;

export const HistoricalBalanceTransferSchema = z
  .object({
    value: decimalStringField(
      "Transferred amount encoded as a decimal string.",
    ),
    from: addressOutputField("Sender address."),
    to: addressOutputField("Recipient address."),
  })
  .openapi("HistoricalBalanceTransfer", {
    description: "Transfer event associated with a historical balance row.",
  });

export const HistoricalBalanceResponseSchema = z
  .object({
    transactionHash: txHashField(),
    daoId: daoIdField(),
    accountId: addressOutputField("Account address."),
    balance: z.string().openapi({
      description: "Account balance after the historical event.",
    }),
    delta: z.string().openapi({
      description: "Balance change introduced by the historical event.",
    }),
    timestamp: unixSecondsStringField("Event"),
    logIndex: logIndexField(),
    transfer: HistoricalBalanceTransferSchema,
  })
  .openapi("HistoricalBalance", {
    description:
      "Single historical balance record enriched with transfer context.",
  });

export const HistoricalBalancesResponseSchema = paginatedListResponse(
  HistoricalBalanceResponseSchema,
  "Total number of matching historical balance rows.",
).openapi("HistoricalBalancesResponse", {
  description: "Paginated historical balance records for one account.",
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
