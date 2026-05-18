import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";

import { DAOClient } from "@/clients";
import {
  ErrorResponseSchema,
  ProposalSearchRequestSchema,
  ProposalsResponseSchema,
  ProposalsLeanResponseSchema,
  ProposalsRequestSchema,
  ProposalRequestSchema,
  ProposalResponseSchema,
  ProposalLeanResponseSchema,
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
      description: "Returns a list of proposal",
      tags: ["proposals", "skip-pagination"],
      middleware: [setCacheControl(60)],
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
      operationId: "proposalsLean",
      path: "/proposals/lean",
      summary: "Get proposals (lean)",
      description:
        "Returns a list of proposals without execution payload fields (calldatas, values, targets). Use this when calldata is not needed.",
      tags: ["proposals", "skip-pagination"],
      middleware: [setCacheControl(60)],
      request: {
        query: ProposalsRequestSchema,
      },
      responses: {
        200: {
          description: "Successfully retrieved proposals (lean)",
          content: {
            "application/json": {
              schema: ProposalsLeanResponseSchema,
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
            ProposalMapper.toLeanApi(p, quorums[index]!, blockTime),
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
      operationId: "searchProposalsLean",
      path: "/proposals/lean/search",
      summary: "Search proposals (lean)",
      description:
        "Returns matching proposals without execution payload fields (calldatas, values, targets).",
      tags: ["proposals", "skip-pagination"],
      middleware: [setCacheControl(60)],
      request: {
        query: ProposalSearchRequestSchema,
      },
      responses: {
        200: {
          description: "Successfully retrieved matching proposals (lean)",
          content: {
            "application/json": {
              schema: ProposalsLeanResponseSchema,
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
            ProposalMapper.toLeanApi(p, quorums[index]!, blockTime),
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
      operationId: "proposalLean",
      path: "/proposals/lean/{id}",
      summary: "Get a proposal by ID (lean)",
      description:
        "Returns a single proposal by its ID without execution payload fields (calldatas, values, targets).",
      tags: ["proposals"],
      middleware: [setCacheControl(60)],
      request: {
        params: ProposalRequestSchema,
      },
      responses: {
        200: {
          description: "Successfully retrieved proposal (lean)",
          content: {
            "application/json": {
              schema: ProposalLeanResponseSchema,
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
        ProposalMapper.toLeanApi(proposal, quorum, blockTime),
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
      middleware: [setCacheControl(60)],
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
