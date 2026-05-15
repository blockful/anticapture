import { z } from "@hono/zod-openapi";

import { daoMetricsDayBucket } from "@/database";
import { SECONDS_IN_DAY } from "@/lib/enums";

import {
  OrderDirectionSchema,
  paginatedListResponse,
  paginationLimitQueryParam,
  paginationSkipQueryParam,
  unixTimestampQueryParam,
} from "../shared";

export type DBTokenMetric = typeof daoMetricsDayBucket.$inferSelect;

// === ZOD SCHEMAS ===

// Repository filters: time window + ordering + size cap.
export const RepositoryFiltersSchema = z.object({
  startDate: unixTimestampQueryParam(
    "Inclusive lower bound for the day-bucket window, in Unix seconds.",
  ),
  endDate: unixTimestampQueryParam(
    "Inclusive upper bound for the day-bucket window, in Unix seconds.",
  ),
  orderDirection: OrderDirectionSchema.optional(),
  limit: z.number().int(),
});

export const DelegationPercentageRequestSchema = z
  .object({
    startDate: unixTimestampQueryParam(
      "Inclusive lower bound for the day-bucket window, in Unix seconds.",
    ),
    endDate: unixTimestampQueryParam(
      "Inclusive upper bound for the day-bucket window, in Unix seconds.",
    ),
    orderDirection: OrderDirectionSchema.optional().default("asc"),
    skip: paginationSkipQueryParam(
      "Number of day buckets to skip before returning results.",
    ),
    limit: paginationLimitQueryParam(
      "Maximum number of day buckets to return.",
      365,
    ).openapi({ example: "365" }),
  })
  .openapi("DelegationPercentageRequest");

export const DelegationPercentageItemSchema = z
  .object({
    date: z.string().openapi({
      description: "Unix day bucket represented as a timestamp string.",
      example: "1704067200",
    }),
    high: z.string().openapi({
      description: "Delegation percentage value for the day bucket.",
      example: "42.75",
    }),
  })
  .openapi("DelegationPercentageItem");

export const DelegationPercentageResponseSchema = paginatedListResponse(
  DelegationPercentageItemSchema,
  "Total number of matching day buckets across the requested window (ignores skip/limit).",
).openapi("DelegationPercentageResponse");

// === INFERRED TYPES ===

export type DelegationPercentageQuery = z.infer<
  typeof DelegationPercentageRequestSchema
>;

export type DelegationPercentageItem = z.infer<
  typeof DelegationPercentageItemSchema
>;
export type DelegationPercentageResponse = z.infer<
  typeof DelegationPercentageResponseSchema
>;

// === MAPPER FUNCTIONS ===

/**
 * Normalizes a timestamp to midnight UTC (00:00:00)
 * This ensures alignment with database timestamps which are always stored at midnight
 * @param timestamp - Unix timestamp in seconds as string
 * @returns Normalized timestamp at midnight UTC
 */
export function normalizeTimestamp(timestamp: string | number): string {
  const ts = BigInt(timestamp);
  const midnight = (ts / BigInt(SECONDS_IN_DAY)) * BigInt(SECONDS_IN_DAY);
  return midnight.toString();
}

/**
 * Maps service result to HTTP response format
 */
export function toApi(serviceResult: {
  items: DelegationPercentageItem[];
  totalCount: number;
}): DelegationPercentageResponse {
  return {
    items: serviceResult.items,
    totalCount: serviceResult.totalCount,
  };
}
