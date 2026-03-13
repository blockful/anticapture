import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";

import {
  TokenMetricsRequestSchema,
  TokenMetricsResponseSchema,
  toTokenMetricsApi,
} from "@/mappers/token-metrics";
import { TokenMetricsService } from "@/services/token-metrics";

export function tokenMetrics(app: Hono, service: TokenMetricsService) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "tokenMetrics",
      path: "/token-metrics",
      summary: "Get token related metrics",
      description: `Returns token related metrics for a single metric type.`,
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
      const serviceResult = await service.getMetricsForType(
        ctx.req.valid("query"),
      );
      const httpResponse = toTokenMetricsApi(serviceResult);
      return ctx.json(httpResponse);
    },
  );
}
