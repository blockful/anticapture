import { z } from "@hono/zod-openapi";

import { PERIOD_UNBOUND } from "./constants";
import { FeedEventType, FeedRelevance } from "@/lib/constants";
import { DaysEnum } from "@/lib/enums";

export type AmountFilter = {
  minAmount: number | bigint | undefined;
  maxAmount: number | bigint | undefined;
};

export const OrderDirectionSchema = z
  .enum(["asc", "desc"])
  .openapi("OrderDirection", {
    description: "Sort direction for ordered query results.",
  });

const DaysWindowEnum = z.enum(["_7d", "_30d", "_90d", "_180d", "_365d"]); // _ because graphql type cannot start with a number

export const DaysWindow = z
  .preprocess((value) => {
    if (typeof value === "string" && /^\d+d$/.test(value)) {
      return `_${value}`;
    }

    return value;
  }, DaysWindowEnum.default("_90d"))
  .transform((val) => DaysEnum[val.slice(1) as keyof typeof DaysEnum])
  .openapi("DaysWindow");

export const PeriodResponseSchema = z
  .object({
    startTimestamp: z.string(),
    endTimestamp: z.string(),
  })
  .openapi("PeriodResponse", {
    description: "Inclusive time period represented as ISO-8601 timestamps.",
  });

export const ErrorResponseSchema = z
  .object({
    error: z.string().openapi({
      description: "Human-readable error message",
      example: "Proposal not found",
    }),
  })
  .openapi("ErrorResponse", {
    description: "Generic error payload returned by the API.",
  });

export const FeedEventTypeSchema = z
  .nativeEnum(FeedEventType)
  .openapi("FeedEventType");

export const FeedRelevanceSchema = z
  .nativeEnum(FeedRelevance)
  .openapi("FeedRelevance");

export const VoteSupportSchema = z
  .enum(["0", "1", "2"])
  .openapi("VoteSupport", {
    description: "Governance vote direction.",
    example: "1",
  });

export const PageInfoSchema = z
  .object({
    hasNextPage: z
      .boolean()
      .openapi({ description: "Whether more items are available." }),
    hasPreviousPage: z
      .boolean()
      .openapi({ description: "Whether earlier items are available." }),
    endDate: z
      .string()
      .nullable()
      .openapi({ description: "End cursor for the current page." }),
    startDate: z
      .string()
      .nullable()
      .openapi({ description: "Start cursor for the current page." }),
  })
  .openapi("PageInfo");

export const normalizeQueryArray = (value: unknown): unknown[] | undefined => {
  if (value == null || value === "") {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) =>
      typeof item === "string" ? item.split(",") : [item],
    );
  }

  if (typeof value === "string") {
    return value.split(",");
  }

  return [value];
};

export const unixTimestampQueryParam = (
  description: string,
  example = 1700000000,
) =>
  z.coerce.number().int().optional().openapi({
    type: "integer",
    description,
    example,
  });

export const TimestampResponseMapper = (
  timestamp: number | undefined,
): string => {
  return timestamp ? new Date(timestamp * 1000).toISOString() : PERIOD_UNBOUND;
};
