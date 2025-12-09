import { z } from "zod";
import { SECONDS_IN_DAY } from "@/lib/enums";

// === ZOD SCHEMAS ===

// Base schema for filters
const BaseFiltersSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  orderDirection: z.enum(["asc", "desc"]).optional(),
  limit: z.number().optional(),
});

// Repository filters schema
export const RepositoryFiltersSchema = BaseFiltersSchema.extend({
  orderDirection: z.enum(["asc", "desc"]).default("asc"),
  limit: z.number(), // Required in repository layer
});

// HTTP query schema (extends base with pagination cursors and HTTP validations)
export const DelegationPercentageRequestSchema = BaseFiltersSchema.extend({
  // Cursor for pagination - returns items after this date (exclusive)
  after: z.string().optional(),
  // Cursor for pagination - returns items before this date (exclusive)
  before: z.string().optional(),
  orderDirection: z.enum(["asc", "desc"]).default("asc"),
  limit: z.coerce.number().int().positive().max(1000).default(365),
});

export const DelegationPercentageItemSchema = z.object({
  date: z.string(),
  high: z.string(),
});

export const PageInfoSchema = z.object({
  hasNextPage: z.boolean(),
  endDate: z.string().nullable(),
  startDate: z.string().nullable(),
});

export const DelegationPercentageResponseSchema = z.object({
  items: z.array(DelegationPercentageItemSchema),
  totalCount: z.number(),
  pageInfo: PageInfoSchema,
});

// === INFERRED TYPES ===

export type RepositoryFilters = z.infer<typeof RepositoryFiltersSchema>;
export type DelegationPercentageQuery = z.infer<
  typeof DelegationPercentageRequestSchema
>;
export type DelegationPercentageItem = z.infer<
  typeof DelegationPercentageItemSchema
>;
export type PageInfo = z.infer<typeof PageInfoSchema>;
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
  endDate: string | null;
  startDate: string | null;
}): DelegationPercentageResponse {
  return {
    items: serviceResult.items,
    totalCount: serviceResult.totalCount,
    pageInfo: {
      hasNextPage: serviceResult.hasNextPage,
      endDate: serviceResult.endDate,
      startDate: serviceResult.startDate,
    },
  };
}
