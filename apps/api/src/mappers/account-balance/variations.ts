import { z } from "@hono/zod-openapi";
import { Address, getAddress, isAddress } from "viem";

import { PERCENTAGE_NO_BASELINE } from "../constants";
import {
  normalizeQueryArray,
  OrderDirectionSchema,
  paginationLimitQueryParam,
  paginationSkipQueryParam,
  PeriodResponseSchema,
  TimestampResponseMapper,
  unixTimestampQueryParam,
} from "../shared";

const AddressArraySchema = z
  .array(
    z
      .string()
      .refine(isAddress, "Invalid address")
      .transform((addr) => getAddress(addr)),
  )
  .openapi("AccountBalanceVariationAddressList");

export const AccountBalanceVariationsByAccountIdRequestParamsSchema = z
  .object({
    address: z
      .string()
      .refine(isAddress, "Invalid address")
      .transform((addr) => getAddress(addr)),
  })
  .openapi("AccountBalanceVariationsByAccountIdRequestParams", {
    description: "Path params for a single-account balance variation request.",
  });

export const AccountBalanceVariationsByAccountIdRequestQuerySchema = z
  .object({
    fromDate: unixTimestampQueryParam(
      "Inclusive lower bound for the comparison window, in Unix seconds.",
    ),
    toDate: unixTimestampQueryParam(
      "Inclusive upper bound for the comparison window, in Unix seconds.",
    ),
  })
  .openapi("AccountBalanceVariationsByAccountIdRequestQuery", {
    description:
      "Time-window filters for a single-account balance variation request.",
  });

export const AccountBalanceVariationsRequestQuerySchema =
  AccountBalanceVariationsByAccountIdRequestQuerySchema.extend({
    limit: paginationLimitQueryParam(
      "Maximum number of account balance variations to return.",
      20,
    ),
    skip: paginationSkipQueryParam(
      "Number of account balance variations to skip.",
    ),
    orderDirection: OrderDirectionSchema.optional().default("desc"),
    addresses: z
      .preprocess(normalizeQueryArray, AddressArraySchema.optional())
      .openapi({
        description:
          "Filter by one or more account addresses. Pass repeated query params or a comma-delimited list.",
      })
      .optional(),
  }).openapi("AccountBalanceVariationsRequestQuery", {
    description:
      "Query params used to page and filter account balance variations.",
  });

export const AccountBalanceVariationSchema = z
  .object({
    accountId: z.string().openapi({ description: "Account address." }),
    previousBalance: z.string().openapi({
      description: "Balance at the start of the comparison window.",
    }),
    currentBalance: z.string().openapi({
      description: "Balance at the end of the comparison window.",
    }),
    absoluteChange: z.string().openapi({
      description: "Absolute balance change encoded as a decimal string.",
    }),
    percentageChange: z.string().openapi({
      description: "Relative balance change encoded as a decimal string.",
    }),
  })
  .openapi("AccountBalanceVariation", {
    description: "Balance delta for a single account across two timestamps.",
  });

export const AccountBalanceVariationsByAccountIdResponseSchema = z
  .object({
    period: PeriodResponseSchema,
    data: AccountBalanceVariationSchema,
  })
  .openapi("AccountBalanceVariationsByAccountIdResponse", {
    description: "Balance variation response for a single account.",
  });

export const AccountBalanceVariationsResponseSchema = z
  .object({
    period: PeriodResponseSchema,
    items: z.array(AccountBalanceVariationSchema),
  })
  .openapi("AccountBalanceVariationsResponse", {
    description:
      "List of balance variations for multiple accounts in the selected period.",
  });

export type AccountBalanceVariationsResponse = z.infer<
  typeof AccountBalanceVariationsResponseSchema
>;

export type AccountBalanceVariationResponse = z.infer<
  typeof AccountBalanceVariationsByAccountIdResponseSchema
>;

export type AccountBalanceVariation = z.infer<
  typeof AccountBalanceVariationSchema
>;

export type DBAccountBalanceVariation = {
  accountId: Address;
  previousBalance: bigint;
  currentBalance: bigint;
  absoluteChange: bigint;
  percentageChange: string;
};

export const PercentageChangeMapper = (variation: {
  previousBalance: bigint;
  currentBalance: bigint;
  percentageChange: string;
}): string => {
  return !variation.previousBalance && variation.currentBalance
    ? PERCENTAGE_NO_BASELINE
    : variation.percentageChange.toString();
};

export const AccountBalanceVariationMapper = (
  variation: DBAccountBalanceVariation,
): AccountBalanceVariation => ({
  accountId: variation.accountId,
  previousBalance: variation.previousBalance.toString(),
  currentBalance: variation.currentBalance.toString(),
  absoluteChange: variation.absoluteChange.toString(),
  percentageChange: PercentageChangeMapper(variation),
});

export const AccountBalanceVariationsByAccountIdResponseMapper = (
  variation: DBAccountBalanceVariation,
  startTimestamp: number | undefined,
  endTimestamp: number | undefined,
): AccountBalanceVariationResponse => {
  return AccountBalanceVariationsByAccountIdResponseSchema.parse({
    period: PeriodResponseSchema.parse({
      startTimestamp: TimestampResponseMapper(startTimestamp),
      endTimestamp: TimestampResponseMapper(endTimestamp),
    }),
    data: AccountBalanceVariationMapper(variation),
  });
};

export const AccountBalanceVariationsResponseMapper = (
  variations: DBAccountBalanceVariation[],
  startTimestamp: number | undefined,
  endTimestamp: number | undefined,
): AccountBalanceVariationsResponse => {
  return AccountBalanceVariationsResponseSchema.parse({
    period: PeriodResponseSchema.parse({
      startTimestamp: TimestampResponseMapper(startTimestamp),
      endTimestamp: TimestampResponseMapper(endTimestamp),
    }),
    items: variations.map(AccountBalanceVariationMapper),
  });
};
