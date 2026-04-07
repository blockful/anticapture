import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";

import {
  TokenMetricsRequestSchema,
  TokenMetricsResponseSchema,
  toTokenMetricsApi,
} from "@/mappers/token-metrics";
import {} from "@/mappers";

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
      const query = ctx.req.valid("query");
      const serviceResult = await service.getMetricsForType({
        ...query,
        orderDirection: query.orderDirection ?? "asc",
      });
      const httpResponse = toTokenMetricsApi(serviceResult);
      ctx.header("Cache-Control", "public, max-age=300");
      return ctx.json(httpResponse, 200);
    },
  );
}
