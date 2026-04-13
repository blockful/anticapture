import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";

import { DAOClient } from "@/clients";
import {
  ErrorResponseSchema,
  ProposalSearchRequestSchema,
  ProposalsResponseSchema,
  ProposalsRequestSchema,
  ProposalRequestSchema,
  ProposalResponseSchema,
  ProposalMapper,
} from "@/mappers";
import { ProposalsService } from "@/services";

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
      tags: ["proposals", "skip-pagination"],
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

      return context.json(
        {
          items: result.map((p, index) =>
            ProposalMapper.toApi(p, quorums[index]!, blockTime),
          ),
          totalCount: await service.getProposalsCount(),
        },
        200,
      );
    },
  );

  app.openapi(
    createRoute({
      method: "get",
      operationId: "searchProposals",
      path: "/proposals/search",
      summary: "Search proposals",
      description:
        "Returns proposals whose title or identifier partially matches the query.",
      tags: ["proposals", "skip-pagination"],
      request: {
        query: ProposalSearchRequestSchema,
      },
      responses: {
        200: {
          description: "Successfully retrieved matching proposals",
          content: {
            "application/json": {
              schema: ProposalsResponseSchema,
            },
          },
        },
      },
    }),
    async (context) => {
      const { query, skip, limit } = context.req.valid("query");

      const result = await service.searchProposals({
        query,
        skip,
        limit,
      });

      const quorums = await Promise.all(
        result.map((p) => client.getQuorum(p.id)),
      );

      return context.json(
        {
          items: result.map((p, index) =>
            ProposalMapper.toApi(p, quorums[index]!, blockTime),
          ),
          totalCount: await service.getSearchProposalsCount(query),
        },
        200,
      );
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

      const proposal = await service.getProposalById(id);

      if (!proposal) {
        return context.json(
          ErrorResponseSchema.parse({ error: "Proposal not found" }),
          404,
        );
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
}
