import { z } from "zod";
import { MetricTypesEnum } from "@/lib/constants";

// === ZOD SCHEMAS ===

const metricTypeSchema = z.nativeEnum(MetricTypesEnum);

/**
 * Accepts single metric type or array of metric types (repeated query params)
 * - ?type=CEX_SUPPLY
 * - ?type=CEX_SUPPLY&type=DEX_SUPPLY
 */
const typeSchema = z.union([
  metricTypeSchema.transform((val) => [val]),
  z.array(metricTypeSchema),
]);

/**
 * Request schema for GET /token-metrics
 */
export const TokenMetricsRequestSchema = z.object({
  type: typeSchema,
  startDate: z.coerce.number().optional(),
  endDate: z.coerce.number().optional(),
  orderDirection: z.enum(["asc", "desc"]).default("asc"),
  limit: z.coerce.number().int().positive().max(1000).default(365),
  after: z.coerce.number().optional(),
  before: z.coerce.number().optional(),
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
export const TokenMetricsTypeResponseSchema = z.object({
  items: z.array(TokenMetricItemSchema),
  pageInfo: TokenMetricsPageInfoSchema,
});

/**
 * Full response schema - keyed by metric type
 * Dynamic keys based on requested types
 */
export const TokenMetricsResponseSchema = z.record(
  z.string(),
  TokenMetricsTypeResponseSchema,
);

/**
 * === INFERRED TYPES ===
 */
export type TokenMetricsQuery = z.infer<typeof TokenMetricsRequestSchema>;
export type TokenMetricItem = z.infer<typeof TokenMetricItemSchema>;
export type TokenMetricsResponse = z.infer<typeof TokenMetricsResponseSchema>;

// === SERVICE RESULT TYPES ===

export interface TokenMetricsServiceResult {
  [metricType: string]: {
    items: TokenMetricItem[];
    hasNextPage: boolean;
    startDate: string | null;
    endDate: string | null;
  };
}

/**
 * Maps service result to HTTP response format for GET /token-metrics
 */
export function toTokenMetricsApi(
  serviceResult: TokenMetricsServiceResult,
): TokenMetricsResponse {
  const response: TokenMetricsResponse = {};

  for (const [metricType, data] of Object.entries(serviceResult)) {
    response[metricType] = {
      items: data.items,
      pageInfo: {
        hasNextPage: data.hasNextPage,
        startDate: data.startDate,
        endDate: data.endDate,
      },
    };
  }

  return response;
}
