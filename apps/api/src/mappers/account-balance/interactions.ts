import { z } from "@hono/zod-openapi";

import {
  AddressSchema,
  PeriodResponseSchema,
  TimestampResponseMapper,
  addressPathParams,
  defaultDescOrderDirection,
  inclusiveDateRangeQueryParams,
  paginationLimitQueryParam,
  paginationSkipQueryParam,
} from "../shared";

import { DBAccountBalanceVariation } from "./variations";

export const AccountInteractionsParamsSchema = addressPathParams(
  "AccountInteractionsParams",
  "Path params for account interaction queries.",
);

export const AccountInteractionsQuerySchema = z
  .object({
    ...inclusiveDateRangeQueryParams("transfer timestamps"),
    limit: paginationLimitQueryParam(
      "Maximum number of interaction rows to return.",
      20,
    ),
    skip: paginationSkipQueryParam("Number of interaction rows to skip."),
    orderDirection: defaultDescOrderDirection(),
    minAmount: z
      .string()
      .transform((val) => BigInt(val))
      .openapi({
        description:
          "Minimum net amount transferred, encoded as a decimal string.",
      })
      .optional(),
    maxAmount: z
      .string()
      .transform((val) => BigInt(val))
      .openapi({
        description:
          "Maximum net amount transferred, encoded as a decimal string.",
      })
      .optional(),
    orderBy: z.enum(["volume", "count"]).optional().default("count").openapi({
      description: "Field used to sort interaction rows.",
      example: "count",
    }),
    filterAddress: AddressSchema.openapi({
      description: "Optional counterparty address used to narrow the results.",
    }).optional(),
  })
  .openapi("AccountInteractionsQuery", {
    description: "Query params used to filter and page account interactions.",
  });

export const AccountInteractionResponseSchema = z
  .object({
    accountId: z.string().openapi({
      description: "Counterparty account ID.",
      format: "ethereum-address",
    }),
    amountTransferred: z.string().openapi({
      description:
        "Net amount transferred between the requested account and the counterparty.",
      format: "int64",
    }),
    totalVolume: z.string().openapi({
      description:
        "Gross transfer volume between the requested account and the counterparty.",
      format: "int64",
    }),
    transferCount: z.string().openapi({
      description: "Number of transfers observed for the interaction pair.",
      format: "int64",
    }),
  })
  .openapi("AccountInteraction", {
    description:
      "Aggregated interaction metrics between the requested account and another account.",
  });

export const AccountInteractionsResponseSchema = z
  .object({
    period: PeriodResponseSchema,
    totalCount: z.number().int(),
    items: z.array(AccountInteractionResponseSchema),
  })
  .openapi("AccountInteractionsResponse", {
    description: "Paginated list of account interaction aggregates.",
  });

export type AccountInteractionsResponse = z.infer<
  typeof AccountInteractionsResponseSchema
>;

export type DBAccountInteraction = DBAccountBalanceVariation & {
  totalVolume: bigint;
  transferCount: bigint;
};

export interface AccountInteractions {
  interactionCount: number;
  interactions: DBAccountInteraction[];
}

export const AccountInteractionsMapper = (
  interactions: AccountInteractions,
  startTimestamp: number | undefined,
  endTimestamp: number | undefined,
): AccountInteractionsResponse => {
  return AccountInteractionsResponseSchema.parse({
    period: PeriodResponseSchema.parse({
      startTimestamp: TimestampResponseMapper(startTimestamp),
      endTimestamp: TimestampResponseMapper(endTimestamp),
    }),
    totalCount: interactions.interactionCount,
    items: interactions.interactions.map(
      ({ accountId, absoluteChange, totalVolume, transferCount }) => ({
        accountId: accountId,
        amountTransferred: absoluteChange.toString(),
        totalVolume: totalVolume.toString(),
        transferCount: transferCount.toString(),
      }),
    ),
  });
};
