import { FastifyInstance } from "fastify";

import { apiUrls } from "@/config/env";
import { aggregateApisWithPath } from "@/services/aggregator";

export function healthRoutes(fastify: FastifyInstance) {
  // Health check endpoint - checks health of all configured APIs
  fastify.get("/health", async () => {
    const { responses } = await aggregateApisWithPath("/health");

    const successCount = responses.filter((r) => r.success).length;

    return {
      status: successCount === apiUrls.length ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
      configuredApis: apiUrls.length,
      successfulApis: successCount,
      apis: responses,
    };
  });
}
