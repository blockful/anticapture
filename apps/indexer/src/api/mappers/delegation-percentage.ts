import { z } from "zod";

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
  limit: z.number(), // Required in repository layer
});

// HTTP query schema (extends base with pagination cursors and HTTP validations)
export const DelegationPercentageQuerySchema = BaseFiltersSchema.extend({
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
  typeof DelegationPercentageQuerySchema
>;
export type DelegationPercentageItem = z.infer<
  typeof DelegationPercentageItemSchema
>;
export type PageInfo = z.infer<typeof PageInfoSchema>;
export type DelegationPercentageResponse = z.infer<
  typeof DelegationPercentageResponseSchema
>;

/**
 * Type representing a DAO metric row from the database
 * Used for type-safe mocking in tests
 */
export type DaoMetricRow = {
  date: bigint;
  daoId: string;
  tokenId: string;
  metricType: string;
  high: bigint;
};

// === MAPPER FUNCTIONS ===

/**
 * Maps service result to HTTP response format
 */
export function mapServiceToHttpResponse(serviceResult: {
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
