import { OpenAPIHono as Hono, createRoute, z } from "@hono/zod-openapi";

import { VotesService } from "@/api/services";
import {
  VotersRequestSchema,
  VotersResponseSchema,
  VotesRequestQuerySchema,
  VotesRequestSchema,
  VotesResponseSchema,
} from "@/api/mappers";

export function votes(app: Hono, service: VotesService) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "votesTimestamp",
      path: "/votes",
      summary: "Get all votes",
      description: "Get all votes ordered by timestamp or voting power",
      tags: ["votes"],
      request: {
        query: VotesRequestQuerySchema,
      },
      responses: {
        200: {
          description: "Returns votes",
          content: {
            "application/json": {
              schema: VotesResponseSchema,
            },
          },
        },
      },
    }),
    async (context) => {
      const { limit, skip, orderBy, orderDirection, fromDate, toDate } =
        context.req.valid("query");

      const result = await service.getVotes({
        limit,
        skip,
        orderBy,
        orderDirection,
        fromDate,
        toDate,
      });

      return context.json(VotesResponseSchema.parse(result));
    },
  );

  app.openapi(
    createRoute({
      method: "get",
      operationId: "proposalNonVoters",
      path: "/proposals/{id}/non-voters",
      summary: "Get a proposal non-voters",
      description:
        "Returns the active delegates that did not vote on a given proposal",
      tags: ["proposals"],
      request: {
        params: z.object({
          id: z.string(),
        }),
        query: VotersRequestSchema,
      },
      responses: {
        200: {
          description: "Successfully retrieved proposal",
          content: {
            "application/json": {
              schema: VotersResponseSchema,
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

  app.openapi(
    createRoute({
      method: "get",
      operationId: "votesByProposalId",
      path: "/proposals/{id}/votes",
      summary: "List of votes for a given proposal",
      description:
        "Returns a paginated list of votes cast on a specific proposal",
      tags: ["proposals"],
      request: {
        params: z.object({
          id: z.string(),
        }),
        query: VotesRequestSchema,
      },
      responses: {
        200: {
          description: "Successfully retrieved votes",
          content: {
            "application/json": {
              schema: VotesResponseSchema,
            },
          },
        },
      },
    }),
    async (context) => {
      const { id } = context.req.valid("param");
      const { skip, limit, voterAddressIn, orderBy, orderDirection, support } =
        context.req.valid("query");

      const { totalCount, items } = await service.getVotesByProposal(
        id,
        skip,
        limit,
        orderBy,
        orderDirection,
        voterAddressIn,
        support,
      );

      return context.json({ totalCount, items });
    },
  );
}
