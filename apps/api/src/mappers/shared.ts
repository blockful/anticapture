import { z } from "@hono/zod-openapi";
import { getAddress, isAddress } from "viem";

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

export const DaysWindow = z
  .enum(["7d", "30d", "90d", "180d", "365d"])
  .optional()
  .prefault("90d")
  .transform((val) => DaysEnum[val as keyof typeof DaysEnum])
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
    message: z.string().optional().openapi({
      description:
        "Optional implementation detail or validation context for the error.",
      example: "Validation error: Expected number, received string",
    }),
  })
  .openapi("ErrorResponse", {
    description: "Generic error payload returned by the API.",
  });

export const ValidationErrorResponseSchema = ErrorResponseSchema.openapi(
  "ValidationErrorResponse",
  {
    description: "Validation error payload returned for invalid request input.",
  },
);

export const FeedEventTypeSchema = z
  .enum(FeedEventType)
  .openapi("FeedEventType", {
    description: "Filter events by governance activity type.",
  });

export const FeedRelevanceSchema = z
  .enum(FeedRelevance)
  .openapi("FeedRelevance", {
    description: "Filter events by relevance tier.",
  });

export const VoteSupportSchema = z.string().openapi("VoteSupport", {
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

export const paginationSkipQueryParam = (
  description = "Number of records to skip before collecting results.",
) =>
  z.coerce.number().int().min(0).optional().default(0).openapi({
    type: "integer",
    description,
    example: 0,
  });

export const paginationLimitQueryParam = (
  description = "Maximum number of records to return.",
  example = 10,
  max = 1000,
) =>
  z.coerce.number().int().min(1).max(max).optional().default(example).openapi({
    type: "integer",
    description,
    example,
  });

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

export const AddressSchema = z
  .string()
  .refine((addr) => isAddress(addr, { strict: false }), "Invalid address")
  .transform((addr) => getAddress(addr));

export const AddressArraySchema = z.array(AddressSchema);

export const AddressQueryArraySchema = z
  .union([AddressSchema.transform((val) => [val]), AddressArraySchema])
  .openapi({ type: "array", items: { type: "string" } });

export const unixTimestampQueryParam = (description: string) =>
  z.coerce.number().int().optional().openapi({
    type: "integer",
    description,
    example: 1700000000,
  });

const errorResponseContent = {
  "application/json": {
    schema: ErrorResponseSchema,
  },
} as const;

// TODO not used today because of graphQL fragments, but will be used when we migrate to REST
export const standardErrorResponses = {
  400: {
    description: "Validation error",
    content: errorResponseContent,
  },
  500: {
    description: "Internal server error",
    content: errorResponseContent,
  },
} as const;

export const TimestampResponseMapper = (
  timestamp: number | undefined,
): string => {
  return timestamp ? new Date(timestamp * 1000).toISOString() : PERIOD_UNBOUND;
};
