import { OpenAPIHono as Hono, createRoute, z } from "@hono/zod-openapi";

import {
  VotersRequestSchema,
  OffchainVotersResponseSchema,
  ErrorResponseSchema,
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
      tags: ["offchain", "skip-pagination"],
      request: {
        params: z.object({
          id: z.string(),
        }),
        query: VotersRequestSchema,
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
        404: {
          description: "Proposal not found",
          content: {
            "application/json": {
              schema: ErrorResponseSchema,
            },
          },
        },
      },
    }),
    async (context) => {
      const { id } = context.req.valid("param");
      const { skip, limit, orderDirection, addresses } =
        context.req.valid("query");

      const result = await service.getProposalNonVoters(
        id,
        skip,
        limit,
        orderDirection,
        addresses,
      );

      if (!result) {
        return context.json(
          ErrorResponseSchema.parse({ error: "Proposal not found" }),
          404,
        );
      }

      return context.json(result, 200);
    },
  );
}
