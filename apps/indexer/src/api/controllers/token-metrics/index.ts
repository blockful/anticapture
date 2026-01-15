import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";
import { TokenMetricsService } from "@/api/services/token-metrics";
import {
  TokenMetricsRequestSchema,
  TokenMetricsResponseSchema,
  toTokenMetricsApi,
  ALLOWED_TOKEN_METRIC_TYPES,
} from "@/api/mappers/token-metrics";

export function tokenMetrics(app: Hono, service: TokenMetricsService) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "listTokenMetrics",
      path: "/token-metrics",
      summary: "Get token related metrics",
      description: `Returns token related metrics.
        Supports multiple metric types in a single request.
        Available types: ${ALLOWED_TOKEN_METRIC_TYPES.join(", ")}`,
      tags: ["metrics"],
      request: {
        query: TokenMetricsRequestSchema,
      },
      responses: {
        200: {
          description: "Token metrics data keyed by metric type",
          content: {
            "application/json": { schema: TokenMetricsResponseSchema },
          },
        },
      },
    }),
    async (ctx) => {
      const serviceResult = await service.getMetrics(ctx.req.valid("query"));
      const httpResponse = toTokenMetricsApi(serviceResult);
      return ctx.json(httpResponse);
    },
  );
}
