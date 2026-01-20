import { z } from "zod";
import { MetricTypesEnum } from "@/lib/constants";

// === ZOD SCHEMAS ===

export const TokenMetricsRequestSchema = z.object({
  metricType: z.nativeEnum(MetricTypesEnum),
  startDate: z.coerce.number().optional(),
  endDate: z.coerce.number().optional(),
  orderDirection: z.enum(["asc", "desc"]).default("asc"),
  limit: z.coerce.number().int().positive().max(1000).default(365),
  skip: z.coerce.number().int().positive().optional().default(0),
});

/**
 * Single metric item
 */
export const TokenMetricItemSchema = z.object({
  date: z.string(),
  high: z.string(),
  volume: z.string(),
});

/**
 * Page info schema
 */
export const TokenMetricsPageInfoSchema = z.object({
  hasNextPage: z.boolean(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
});

/**
 * Response for a single metric type
 */
export const TokenMetricsResponseSchema = z.object({
  items: z.array(TokenMetricItemSchema),
  pageInfo: TokenMetricsPageInfoSchema,
});

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
