import { FastifyInstance } from "fastify";
import { aggregateApisWithPath } from "@/services/aggregator";

export async function daosRoutes(fastify: FastifyInstance) {
  fastify.get("/daos", async () => {
    return await aggregateApisWithPath("/daos");
  });
}
