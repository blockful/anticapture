import { OpenAPIHono as Hono, createRoute, z } from "@hono/zod-openapi";

import {
  OffchainVotersRequestSchema,
  OffchainVotersResponseSchema,
} from "@/mappers";
import { OffchainNonVotersService } from "@/services";

export function offchainNonVoters(
  app: Hono,
  service: OffchainNonVotersService,
) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "offchainProposalNonVoters",
      path: "/offchain/proposals/{id}/non-voters",
      summary: "Get offchain proposal non-voters",
      description:
        "Returns the active delegates that did not vote on a given offchain proposal",
      tags: ["offchain"],
      request: {
        params: z.object({
          id: z.string(),
        }),
        query: OffchainVotersRequestSchema,
      },
      responses: {
        200: {
          description: "Successfully retrieved non-voters",
          content: {
            "application/json": {
              schema: OffchainVotersResponseSchema,
            },
          },
        },
      },
    }),
    async (context) => {
      const { id } = context.req.valid("param");
      const { skip, limit, orderDirection, addresses } =
        context.req.valid("query");

      const { totalCount, items } = await service.getProposalNonVoters(
        id,
        skip,
        limit,
        orderDirection,
        addresses,
      );
      return context.json({ totalCount, items });
    },
  );
}
