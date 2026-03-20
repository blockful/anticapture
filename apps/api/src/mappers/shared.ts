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
  .openapi("PeriodResponse");

export const ErrorResponseSchema = z
  .object({
    error: z.string().openapi({
      description: "Human-readable error message",
      example: "Proposal not found",
    }),
  })
  .openapi("ErrorResponse");

const parseBooleanQueryValue = (
  value: unknown,
  defaultValue?: boolean,
): boolean | undefined => {
  if (value === undefined) {
    return defaultValue;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (normalized === "true") {
      return true;
    }

    if (normalized === "false") {
      return false;
    }
  }

  return undefined;
};

export const booleanQueryParam = (options: {
  defaultValue?: boolean;
  description: string;
  example?: boolean;
}) =>
  z
    .string()
    .optional()
    .transform((value, ctx) => {
      const parsed = parseBooleanQueryValue(value, options.defaultValue);

      if (parsed === undefined && value !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Expected 'true' or 'false'",
        });
        return z.NEVER;
      }

      return parsed;
    })
    .openapi({
      type: "boolean",
      description: options.description,
      example: options.example ?? options.defaultValue,
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
