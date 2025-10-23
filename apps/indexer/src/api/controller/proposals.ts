import { OpenAPIHono as Hono, createRoute, z } from "@hono/zod-openapi";

import { ProposalsService } from "@/api/services";
import {
  ProposalsResponseSchema,
  ProposalsRequestSchema,
  ProposalRequestSchema,
  ProposalResponseSchema,
  ProposalMapper,
  VotersRequestSchema,
  VotersResponseSchema,
} from "../mappers";
import { DAOClient } from "@/interfaces";

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
      const { skip, limit, orderDirection, status, fromDate } =
        context.req.valid("query");

      const result = await service.getProposals({
        skip,
        limit,
        orderDirection,
        status,
        fromDate,
      });

      const quorums = await Promise.all(
        result.map((p) => client.getQuorum(p.id)),
      );

      const votingDelay = await service.getVotingDelay();

      return context.json({
        items: result.map((p, index) =>
          ProposalMapper.toApi(p, quorums[index]!, blockTime, votingDelay),
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
      const votingDelay = await service.getVotingDelay();

      const quorum = await client.getQuorum(id);
      return context.json(
        ProposalMapper.toApi(proposal, quorum, blockTime, votingDelay),
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
}
