import { OpenAPIHono as Hono, createRoute, z } from "@hono/zod-openapi";

import { ProposalsService } from "@/services";
import {
  ProposalsResponseSchema,
  ProposalsRequestSchema,
  ProposalRequestSchema,
  ProposalResponseSchema,
  ProposalMapper,
  VotersRequestSchema,
  VotersResponseSchema,
  VotesRequestSchema,
  VotesResponseSchema,
} from "@/mappers";
import { DAOClient } from "@/clients";

export function proposals(
  app: Hono,
  service: ProposalsService,
  client: DAOClient,
  blockTime: number,
) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "proposals",
      path: "/proposals",
      summary: "Get proposals",
      description: "Returns a list of proposal",
      tags: ["proposals"],
      request: {
        query: ProposalsRequestSchema,
      },
      responses: {
        200: {
          description: "Successfully retrieved proposals activity",
          content: {
            "application/json": {
              schema: ProposalsResponseSchema,
            },
          },
        },
      },
    }),
    async (context) => {
      const {
        skip,
        limit,
        orderDirection,
        status,
        fromDate,
        fromEndDate,
        includeOptimisticProposals,
      } = context.req.valid("query");

      const result = await service.getProposals({
        skip,
        limit,
        orderDirection,
        status,
        fromDate,
        fromEndDate,
        includeOptimisticProposals,
      });

      const [quorums] = await Promise.all([
        Promise.all(result.map((p) => client.getQuorum(p.id))),
        client.getVotingDelay(),
      ]);

      return context.json({
        items: result.map((p, index) =>
          ProposalMapper.toApi(p, quorums[index]!, blockTime),
        ),
        totalCount: await service.getProposalsCount(),
      });
    },
  );

  app.openapi(
    createRoute({
      method: "get",
      operationId: "proposal",
      path: "/proposals/{id}",
      summary: "Get a proposal by ID",
      description: "Returns a single proposal by its ID",
      tags: ["proposals"],
      request: {
        params: ProposalRequestSchema,
      },
      responses: {
        200: {
          description: "Successfully retrieved proposal",
          content: {
            "application/json": {
              schema: ProposalResponseSchema,
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

      const [quorum] = await Promise.all([
        client.getQuorum(id),
        client.getVotingDelay(),
      ]);

      return context.json(
        ProposalMapper.toApi(proposal, quorum, blockTime),
        200,
      );
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
      operationId: "votes",
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

      const { totalCount, items } = await service.getVotes(
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
