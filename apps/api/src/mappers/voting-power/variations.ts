import { z } from "@hono/zod-openapi";
import { Address } from "viem";

import { accountPower } from "@/database";

import {
  PeriodResponseSchema,
  TimestampResponseMapper,
  addressOutputField,
  addressPathParams,
  addressesQueryFilter,
  bigIntRangeQueryParams,
  bigintAsStringField,
  decimalStringField,
  defaultDescOrderDirection,
  inclusiveDateRangeQueryParams,
  paginatedListResponse,
  paginationLimitQueryParam,
  paginationSkipQueryParam,
} from "../shared";

export const VotingPowerVariationsByAccountIdRequestParamsSchema =
  addressPathParams(
    "VotingPowerVariationsByAccountIdRequestParams",
    "Path params for a single-account voting power variation request.",
  );

export const VotingPowerVariationsByAccountIdRequestQuerySchema = z
  .object({
    ...inclusiveDateRangeQueryParams("the comparison window"),
  })
  .openapi("VotingPowerVariationsByAccountIdRequestQuery", {
    description:
      "Time-window filters for a single-account voting power variation request.",
  });

export const VotingPowerVariationsRequestQuerySchema = z
  .object({
    limit: paginationLimitQueryParam(
      "Maximum number of voting power variation rows to return.",
      20,
    ),
    skip: paginationSkipQueryParam(
      "Number of voting power variation rows to skip.",
    ),
    orderDirection: defaultDescOrderDirection(),
    addresses: addressesQueryFilter(),
  })
  .extend(VotingPowerVariationsByAccountIdRequestQuerySchema.shape)
  .openapi("VotingPowerVariationsRequestQuery", {
    description:
      "Query params used to page and filter voting power variations.",
  });

export const VotingPowersRequestSchema = z
  .object({
    limit: paginationLimitQueryParam(
      "Maximum number of current voting power rows to return.",
      20,
    ),
    skip: paginationSkipQueryParam(
      "Number of current voting power rows to skip.",
    ),
    orderDirection: defaultDescOrderDirection(),
    orderBy: z
      .enum([
        "votingPower",
        "delegationsCount",
        "variation",
        "signedVariation",
        "total",
        "balance",
      ])
      .optional()
      .default("votingPower"),
    addresses: addressesQueryFilter().transform((val) => val ?? []),
    ...bigIntRangeQueryParams("voting power"),
    ...inclusiveDateRangeQueryParams("variation enrichment"),
  })
  .openapi("VotingPowersRequest", {
    description:
      "Query params used to page and filter current voting power records.",
  });

export const VotingPowerByAccountIdRequestParamsSchema = addressPathParams(
  "VotingPowerByAccountIdRequestParams",
  "Path params for fetching the current voting power of a single account.",
);

export const VotingPowerByAccountIdRequestQuerySchema = z
  .object({
    ...inclusiveDateRangeQueryParams("variation enrichment"),
  })
  .openapi("VotingPowerByAccountIdRequestQuery", {
    description:
      "Optional time-window query params used to enrich a single account voting power response.",
  });

export const VotingPowerVariationResponseSchema = z
  .object({
    accountId: addressOutputField("Account address."),
    previousVotingPower: z.string().openapi({
      description: "Voting power at the start of the comparison window.",
      format: "int64",
    }),
    currentVotingPower: z.string().openapi({
      description: "Voting power at the end of the comparison window.",
      format: "int64",
    }),
    absoluteChange: decimalStringField(
      "Absolute voting power change encoded as a decimal string.",
    ),
    percentageChange: z.string().openapi({
      description:
        'Relative voting power change as a decimal string (e.g. "5.23"). Set to the sentinel "NO BASELINE" when the previous voting power is zero.',
    }),
  })
  .openapi("VotingPowerVariation", {
    description:
      "Voting power delta for a single account across two timestamps.",
  });

export const VotingPowerVariationFieldSchema = z
  .object({
    absoluteChange: bigintAsStringField(),
    percentageChange: z.string(),
  })
  .openapi("VotingPowerVariationField", {
    description:
      "Embedded voting power delta metadata for a current voting power row.",
  });

export const VotingPowerResponseSchema = z
  .object({
    accountId: addressOutputField("Account address."),
    votingPower: bigintAsStringField(
      "Current voting power encoded as a decimal string.",
    ),
    votesCount: z.number().int().openapi({
      description: "Total votes cast by the account.",
    }),
    proposalsCount: z.number().int().openapi({
      description: "Total proposals created by the account.",
    }),
    delegationsCount: z.number().int().openapi({
      description: "Total delegations associated with the account.",
    }),
    balance: z
      .bigint()
      .transform((val) => val.toString())
      .optional()
      .openapi({
        type: "string",
        format: "int64",
        description: "Current token balance encoded as a decimal string.",
      }),
    variation: VotingPowerVariationFieldSchema,
  })
  .openapi("VotingPower", {
    description: "Current voting power snapshot for one account.",
  });

export const VotingPowersResponseSchema = paginatedListResponse(
  VotingPowerResponseSchema,
  "Total number of matching voting power rows.",
).openapi("VotingPowersResponse", {
  description: "Paginated current voting power records.",
});

export const VotingPowerVariationsByAccountIdResponseSchema = z
  .object({
    period: PeriodResponseSchema,
    data: VotingPowerVariationResponseSchema,
  })
  .openapi("VotingPowerVariationsByAccountIdResponse", {
    description: "Voting power variation response for a single account.",
  });

export const VotingPowerVariationsResponseSchema = z
  .object({
    period: PeriodResponseSchema,
    items: z.array(VotingPowerVariationResponseSchema),
  })
  .openapi("VotingPowerVariationsResponse", {
    description:
      "List of voting power variations for multiple accounts in the selected period.",
  });

export type VotingPowerVariationResponse = z.infer<
  typeof VotingPowerVariationResponseSchema
>;

export type VotingPowerVariationsResponse = z.infer<
  typeof VotingPowerVariationsResponseSchema
>;

export type VotingPowerVariationsByAccountIdResponse = z.infer<
  typeof VotingPowerVariationsByAccountIdResponseSchema
>;

export type VotingPowersResponse = z.infer<typeof VotingPowersResponseSchema>;

export type VotingPowerResponse = z.infer<typeof VotingPowerResponseSchema>;

export type DBVotingPowerVariation = {
  accountId: Address;
  previousVotingPower: bigint;
  currentVotingPower: bigint;
  absoluteChange: bigint;
  percentageChange: string;
};

export type DBAccountPower = typeof accountPower.$inferSelect;

export type DBAccountPowerWithVariation = DBAccountPower & {
  balance?: bigint;
  absoluteChange: bigint;
  percentageChange: string;
};

export const VotingPowerVariationResponseMapper = (
  delta: DBVotingPowerVariation,
): VotingPowerVariationResponse => ({
  accountId: delta.accountId,
  previousVotingPower: delta.previousVotingPower?.toString(),
  currentVotingPower: delta.currentVotingPower.toString(),
  absoluteChange: delta.absoluteChange.toString(),
  percentageChange: delta.percentageChange,
});

export const VotingPowerVariationsResponseMapper = (
  variations: DBVotingPowerVariation[],
  startTimestamp: number | undefined,
  endTimestamp: number | undefined,
): VotingPowerVariationsResponse => {
  return VotingPowerVariationsResponseSchema.parse({
    period: PeriodResponseSchema.parse({
      startTimestamp: TimestampResponseMapper(startTimestamp),
      endTimestamp: TimestampResponseMapper(endTimestamp),
    }),
    items: variations.map(VotingPowerVariationResponseMapper),
  });
};

export const VotingPowerVariationsByAccountIdResponseMapper = (
  delta: DBVotingPowerVariation,
  startTimestamp: number | undefined,
  endTimestamp: number | undefined,
): VotingPowerVariationsByAccountIdResponse => {
  return VotingPowerVariationsByAccountIdResponseSchema.parse({
    period: PeriodResponseSchema.parse({
      startTimestamp: TimestampResponseMapper(startTimestamp),
      endTimestamp: TimestampResponseMapper(endTimestamp),
    }),
    data: VotingPowerVariationResponseMapper(delta),
  });
};
