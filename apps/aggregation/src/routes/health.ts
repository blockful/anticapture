import { FastifyInstance } from "fastify";

import { apiUrls } from "@/config/env";
import { aggregateApisWithPath } from "@/services/aggregator";

export async function healthRoutes(fastify: FastifyInstance) {
  // Health check endpoint - checks health of all configured APIs
  fastify.get("/health", async () => {
    const apisHealth = await aggregateApisWithPath("/health");

    return {
      status: apisHealth.failureCount === 0 ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
      configuredApis: apiUrls.length,
      apis: apisHealth,
    };
  });
}
