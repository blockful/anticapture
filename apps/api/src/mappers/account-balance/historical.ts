import { z } from "@hono/zod-openapi";

import { balanceHistory } from "@/database";

import {
  AddressSchema,
  OrderDirectionSchema,
  paginationLimitQueryParam,
  paginationSkipQueryParam,
  unixTimestampQueryParam,
} from "../shared";
import { DBTransfer } from "../transfers";

export type DBHistoricalBalance = typeof balanceHistory.$inferSelect;
export type DBHistoricalBalanceWithRelations = DBHistoricalBalance & {
  transfer: DBTransfer;
};

export const HistoricalBalanceRequestParamsSchema = z
  .object({
    address: AddressSchema,
  })
  .openapi("HistoricalBalanceRequestParams", {
    description: "Path params for historical balance queries.",
  });

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
    orderDirection: OrderDirectionSchema.optional().default("desc"),
    fromDate: unixTimestampQueryParam(
      "Inclusive lower bound for historical balance timestamps, in Unix seconds.",
    ),
    toDate: unixTimestampQueryParam(
      "Inclusive upper bound for historical balance timestamps, in Unix seconds.",
    ),
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
    value: z.string().openapi({
      description: "Transferred amount encoded as a decimal string.",
    }),
    from: z.string().openapi({ description: "Sender address." }),
    to: z.string().openapi({ description: "Recipient address." }),
  })
  .openapi("HistoricalBalanceTransfer", {
    description: "Transfer event associated with a historical balance row.",
  });

export const HistoricalBalanceResponseSchema = z
  .object({
    transactionHash: z.string().openapi({ description: "Transaction hash." }),
    daoId: z.string().openapi({ description: "DAO identifier." }),
    accountId: z.string().openapi({ description: "Account address." }),
    balance: z.string().openapi({
      description: "Account balance after the historical event.",
    }),
    delta: z.string().openapi({
      description: "Balance change introduced by the historical event.",
    }),
    timestamp: z.string().openapi({
      description: "Event timestamp in Unix seconds as a string.",
      example: "1704067200",
    }),
    logIndex: z.number().int().openapi({
      description: "Log index within the transaction receipt.",
    }),
    transfer: HistoricalBalanceTransferSchema,
  })
  .openapi("HistoricalBalance", {
    description:
      "Single historical balance record enriched with transfer context.",
  });

export const HistoricalBalancesResponseSchema = z
  .object({
    items: z.array(HistoricalBalanceResponseSchema),
    totalCount: z.number().int().openapi({
      description: "Total number of matching historical balance rows.",
    }),
  })
  .openapi("HistoricalBalancesResponse", {
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
