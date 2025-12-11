import { FastifyInstance } from "fastify";
import { aggregateApisWithPath } from "@/services/aggregator";

export function daosRoutes(fastify: FastifyInstance) {
  fastify.get("/daos", async () => {
    const { responses } = await aggregateApisWithPath("/dao");

    // Transform array into object with DAO names as keys
    const aggregatedData: Record<string, unknown> = {};

    responses
      .filter((response) => response.success && response.data)
      .forEach((response) => {
        const daoName = (response.data as { id: string }).id.toLowerCase();
        aggregatedData[daoName] = response.data;
      });

    return aggregatedData;
  });
}
