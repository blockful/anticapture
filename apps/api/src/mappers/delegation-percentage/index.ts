import { z } from "@hono/zod-openapi";

import { daoMetricsDayBucket } from "@/database";
import { SECONDS_IN_DAY } from "@/lib/enums";

import { OrderDirectionSchema, PageInfoSchema } from "../shared";

export type DBTokenMetric = typeof daoMetricsDayBucket.$inferSelect;

// === ZOD SCHEMAS ===

// Base schema for filters
const BaseFiltersSchema = z.object({
  startDate: z
    .string()
    .openapi({
      description: "Inclusive lower bound cursor as a Unix timestamp string.",
      example: "1704067200",
    })
    .optional(),
  endDate: z
    .string()
    .openapi({
      description: "Inclusive upper bound cursor as a Unix timestamp string.",
      example: "1706745600",
    })
    .optional(),
  orderDirection: OrderDirectionSchema.optional(),
  limit: z.number().optional().openapi({
    description: "Optional limit used by internal filters.",
    example: 365,
    type: "integer",
  }),
});

// Repository filters schema
export const RepositoryFiltersSchema = BaseFiltersSchema.extend({
  orderDirection: OrderDirectionSchema.optional(),
  limit: z.number().int(), // Required in repository layer
});

// HTTP query schema (extends base with pagination cursors and HTTP validations)
export const DelegationPercentageRequestSchema = BaseFiltersSchema.extend({
  // Cursor for pagination - returns items after this date (exclusive)
  after: z
    .string()
    .openapi({
      description: "Return items after this cursor (exclusive).",
      example: "1704067200",
    })
    .optional(),
  // Cursor for pagination - returns items before this date (exclusive)
  before: z
    .string()
    .openapi({
      description: "Return items before this cursor (exclusive).",
      example: "1706745600",
    })
    .optional(),
  orderDirection: OrderDirectionSchema.optional(),
  limit: z.coerce.number().int().positive().max(1000).default(365).openapi({
    description: "Maximum number of buckets to return.",
    example: 365,
    type: "integer",
  }),
}).openapi("DelegationPercentageRequest");

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

export const DelegationPercentageResponseSchema = z
  .object({
    items: z.array(DelegationPercentageItemSchema),
    totalCount: z.number().int().openapi({
      description: "Total number of matching day buckets.",
      example: 365,
    }),
    pageInfo: PageInfoSchema,
  })
  .openapi("DelegationPercentageResponse");

// === INFERRED TYPES ===

export type RepositoryFilters = z.infer<typeof RepositoryFiltersSchema>;
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
export function normalizeTimestamp(timestamp: string): string {
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
  hasNextPage: boolean;
  hasPreviousPage?: boolean;
  endDate: string | null;
  startDate: string | null;
}): DelegationPercentageResponse {
  return {
    items: serviceResult.items,
    totalCount: serviceResult.totalCount,
    pageInfo: {
      hasNextPage: serviceResult.hasNextPage,
      hasPreviousPage: serviceResult.hasPreviousPage ?? false,
      endDate: serviceResult.endDate,
      startDate: serviceResult.startDate,
    },
  };
}
