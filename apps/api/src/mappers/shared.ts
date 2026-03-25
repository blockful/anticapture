import { z } from "@hono/zod-openapi";

import { PERIOD_UNBOUND } from "./constants";

export type AmountFilter = {
  minAmount: number | bigint | undefined;
  maxAmount: number | bigint | undefined;
};

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

export const ValidationErrorDetailSchema = z
  .string()
  .openapi("ValidationErrorDetail", {
    description: "Single validation issue produced while parsing a request.",
    example: 'Expected number, received string at "limit"',
  });

export const ValidationErrorResponseSchema = z
  .object({
    error: z.literal("Validation Error").openapi({
      description: "Static identifier for request validation failures.",
      example: "Validation Error",
    }),
    message: z.string().openapi({
      description: "Combined validation message.",
      example: "Validation error: limit: Expected number, received string",
    }),
    details: z.array(ValidationErrorDetailSchema).optional().openapi({
      description: "Optional list of individual validation issues.",
    }),
  })
  .openapi("ValidationErrorResponse", {
    description:
      "Payload returned when request params, query, or body fail validation.",
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

export const unixTimestampQueryParam = (
  description: string,
  example = 1700000000,
) =>
  z.coerce.number().int().optional().openapi({
    type: "integer",
    description,
    example,
  });

export type PeriodResponse = z.infer<typeof PeriodResponseSchema>;

export const TimestampResponseMapper = (
  timestamp: number | undefined,
): string => {
  return timestamp ? new Date(timestamp * 1000).toISOString() : PERIOD_UNBOUND;
};
