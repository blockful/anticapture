import { OpenAPIHono as Hono, createRoute, z } from "@hono/zod-openapi";

import {
  OffchainProposalResponseSchema,
  OffchainProposalMapper,
  OffchainProposalsResponseSchema,
  OffchainProposalsRequestSchema,
} from "@/mappers";
import { OffchainProposalsService } from "@/services";

export function offchainProposals(
  app: Hono,
  service: OffchainProposalsService,
) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "offchainProposals",
      path: "/offchain/proposals",
      summary: "Get offchain proposals",
      description: "Returns a list of offchain (Snapshot) proposals",
      tags: ["offchain"],
      request: {
        query: OffchainProposalsRequestSchema,
      },
      responses: {
        200: {
          description: "Successfully retrieved offchain proposals",
          content: {
            "application/json": {
              schema: OffchainProposalsResponseSchema,
            },
          },
        },
      },
    }),
    async (context) => {
      const { skip, limit, orderDirection, status, fromDate } =
        context.req.valid("query");

      const { items, totalCount } = await service.getProposals({
        skip,
        limit,
        orderDirection,
        status,
        fromDate,
      });

      return context.json({
        items: items.map(OffchainProposalMapper.toApi),
        totalCount,
      });
    },
  );

  app.openapi(
    createRoute({
      method: "get",
      operationId: "offchainProposalById",
      path: "/offchain/proposals/{id}",
      summary: "Get an offchain proposal by ID",
      description: "Returns a single offchain (Snapshot) proposal by its ID",
      tags: ["offchain"],
      request: {
        params: z.object({ id: z.string() }),
      },
      responses: {
        200: {
          description: "Successfully retrieved offchain proposal",
          content: {
            "application/json": {
              schema: OffchainProposalResponseSchema,
            },
          },
        },
        404: {
          description: "Proposal not found",
        },
      },
    }),
    async (context) => {
      const { id } = context.req.valid("param");

      const proposal = await service.getProposalById(id);

      if (!proposal) {
        return context.json({ error: "Proposal not found" }, 404);
      }

      return context.json(OffchainProposalMapper.toApi(proposal), 200);
    },
  );
}
