import { z } from "@hono/zod-openapi";

import { MetricTypesEnum } from "@/lib/constants";

// === ZOD SCHEMAS ===

export const TokenMetricsRequestSchema = z
  .object({
    metricType: z.nativeEnum(MetricTypesEnum).openapi({
      description: "Metric family to query.",
      example: MetricTypesEnum.TOTAL_SUPPLY,
    }),
    startDate: z.coerce.number().int().optional().openapi({
      description: "Inclusive lower bound as a Unix timestamp in seconds.",
      example: 1704067200,
      type: "integer",
    }),
    endDate: z.coerce.number().int().optional().openapi({
      description: "Inclusive upper bound as a Unix timestamp in seconds.",
      example: 1706745600,
      type: "integer",
    }),
    orderDirection: z.enum(["asc", "desc"]).default("asc").openapi({
      description: "Sort direction for the returned buckets.",
    }),
    limit: z.coerce.number().int().positive().max(1000).default(365).openapi({
      description: "Maximum number of buckets to return.",
      example: 365,
      type: "integer",
    }),
    skip: z.coerce.number().int().min(0).optional().default(0).openapi({
      description: "Number of buckets to skip before returning results.",
      example: 0,
      type: "integer",
    }),
  })
  .openapi("TokenMetricsRequest");

/**
 * Single metric item
 */
export const TokenMetricItemSchema = z
  .object({
    date: z.string().openapi({
      description: "Unix day bucket represented as a timestamp string.",
      example: "1704067200",
    }),
    high: z.string().openapi({
      description: "Highest observed value for the period.",
      example: "14.25",
    }),
    volume: z.string().openapi({
      description: "Total volume observed for the period.",
      example: "1200.5",
    }),
  })
  .openapi("TokenMetricItem");

/**
 * Page info schema
 */
export const TokenMetricsPageInfoSchema = z
  .object({
    hasNextPage: z
      .boolean()
      .openapi({ description: "Whether more items are available." }),
    startDate: z
      .string()
      .nullable()
      .openapi({ description: "Start cursor for the current page." }),
    endDate: z
      .string()
      .nullable()
      .openapi({ description: "End cursor for the current page." }),
  })
  .openapi("TokenMetricsPageInfo");

/**
 * Response for a single metric type
 */
export const TokenMetricsResponseSchema = z
  .object({
    items: z.array(TokenMetricItemSchema),
    pageInfo: TokenMetricsPageInfoSchema,
  })
  .openapi("TokenMetricsResponse");

/**
 * === INFERRED TYPES ===
 */
export type TokenMetricsQuery = z.infer<typeof TokenMetricsRequestSchema>;
export type TokenMetricItem = z.infer<typeof TokenMetricItemSchema>;

// === SERVICE RESULT TYPES ===

export interface TokenMetricsServiceResult {
  items: TokenMetricItem[];
  hasNextPage: boolean;
  startDate: string | null;
  endDate: string | null;
}

/**
 * Maps service result to HTTP response format for GET /token-metrics
 */
export function toTokenMetricsApi(
  serviceResult: TokenMetricsServiceResult,
): z.infer<typeof TokenMetricsResponseSchema> {
  return {
    items: serviceResult.items,
    pageInfo: {
      hasNextPage: serviceResult.hasNextPage,
      startDate: serviceResult.startDate,
      endDate: serviceResult.endDate,
    },
  };
}
