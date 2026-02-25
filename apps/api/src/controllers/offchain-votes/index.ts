import { OpenAPIHono as Hono, createRoute, z } from "@hono/zod-openapi";

import {
  OffchainVoteResponseSchema,
  OffchainVoteMapper,
  OffchainVotesRequestSchema,
} from "@/mappers";
import { OffchainVotesService } from "@/services";

const OffchainVotesResponseSchema = z.object({
  items: z.array(OffchainVoteResponseSchema),
  totalCount: z.number(),
});

export function offchainVotes(app: Hono, service: OffchainVotesService) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "offchainVotes",
      path: "/offchain/votes",
      summary: "Get offchain votes",
      description: "Returns a list of offchain (Snapshot) votes",
      tags: ["offchain"],
      request: {
        query: OffchainVotesRequestSchema,
      },
      responses: {
        200: {
          description: "Successfully retrieved offchain votes",
          content: {
            "application/json": {
              schema: OffchainVotesResponseSchema,
            },
          },
        },
      },
    }),
    async (context) => {
      const {
        skip,
        limit,
        orderBy,
        orderDirection,
        voterAddresses,
        fromDate,
        toDate,
      } = context.req.valid("query");

      const { items, totalCount } = await service.getVotes({
        skip,
        limit,
        orderBy,
        orderDirection,
        voterAddresses,
        fromDate,
        toDate,
      });

      return context.json({
        items: items.map((item) =>
          OffchainVoteMapper.toApi(item, item.proposalTitle),
        ),
        totalCount,
      });
    },
  );

  app.openapi(
    createRoute({
      method: "get",
      operationId: "offchainVotesByProposalId",
      path: "/offchain/proposals/{id}/votes",
      summary: "Get offchain votes for a proposal",
      description:
        "Returns a paginated list of offchain (Snapshot) votes for a specific proposal",
      tags: ["offchain"],
      request: {
        params: z.object({ id: z.string() }),
        query: OffchainVotesRequestSchema,
      },
      responses: {
        200: {
          description: "Successfully retrieved offchain votes",
          content: {
            "application/json": {
              schema: OffchainVotesResponseSchema,
            },
          },
        },
      },
    }),
    async (context) => {
      const { id } = context.req.valid("param");
      const {
        skip,
        limit,
        orderBy,
        orderDirection,
        voterAddresses,
        fromDate,
        toDate,
      } = context.req.valid("query");

      const { items, totalCount } = await service.getVotesByProposalId(id, {
        skip,
        limit,
        orderBy,
        orderDirection,
        voterAddresses,
        fromDate,
        toDate,
      });

      return context.json({
        items: items.map((item) =>
          OffchainVoteMapper.toApi(item, item.proposalTitle),
        ),
        totalCount,
      });
    },
  );
}
