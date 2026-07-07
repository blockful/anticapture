import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";

import { DAOClient } from "@/clients";
import {
  ErrorResponseSchema,
  ProposalByIdQuerySchema,
  ProposalSearchRequestSchema,
  ProposalsResponseSchema,
  ProposalsRequestSchema,
  ProposalRequestSchema,
  ProposalResponseSchema,
  ProposalMapper,
} from "@/mappers";
import { setCacheControl } from "@/middlewares";
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
      description:
        "Returns a list of proposals. Pass `lean=true` to omit calldatas/values/targets and the proposal description, reducing payload size.",
      tags: ["proposals", "skip-pagination"],
      middleware: [setCacheControl(60)],
      request: {
        query: ProposalsRequestSchema,
      },
      responses: {
        200: {
          description: "Successfully retrieved proposals",
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
        lean,
      } = context.req.valid("query");

      const [result, totalCount] = await Promise.all([
        service.getProposals({
          skip,
          limit,
          orderDirection,
          status,
          fromDate,
          fromEndDate,
          includeOptimisticProposals,
          lean,
        }),
        service.getProposalsCount(),
      ]);
      const quorums = await Promise.all(
        result.map((p) => client.getQuorum(p.id)),
      );

      return context.json(
        {
          items: result.map((p, index) =>
            ProposalMapper.toApi(p, quorums[index]!, blockTime, { lean }),
          ),
          totalCount,
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
        "Returns proposals whose title or identifier partially matches the query. Pass `lean=true` to omit calldatas/values/targets and the proposal description.",
      tags: ["proposals", "skip-pagination"],
      middleware: [setCacheControl(60)],
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
      const { query, skip, limit, lean } = context.req.valid("query");

      const [result, totalCount] = await Promise.all([
        service.searchProposals({
          query,
          skip,
          limit,
        }),
        service.getSearchProposalsCount(query),
      ]);
      const quorums = await Promise.all(
        result.map((p) => client.getQuorum(p.id)),
      );

      return context.json(
        {
          items: result.map((p, index) =>
            ProposalMapper.toApi(p, quorums[index]!, blockTime, { lean }),
          ),
          totalCount,
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
      description:
        "Returns a single proposal by its ID. Pass `lean=true` to omit calldatas/values/targets and the proposal description.",
      tags: ["proposals"],
      middleware: [setCacheControl(60)],
      request: {
        params: ProposalRequestSchema,
        query: ProposalByIdQuerySchema,
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
      const { lean } = context.req.valid("query");

      const proposal = await service.getProposalById(id);

      if (!proposal) {
        return context.json(
          ErrorResponseSchema.parse({ error: "Proposal not found" }),
          404,
        );
      }

      const quorum = await client.getQuorum(id);

      return context.json(
        ProposalMapper.toApi(proposal, quorum, blockTime, { lean }),
        200,
      );
    },
  );
}
