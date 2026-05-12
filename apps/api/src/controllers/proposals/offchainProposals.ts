import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";

import {
  ErrorResponseSchema,
  OffchainProposalResponseSchema,
  OffchainProposalLeanResponseSchema,
  OffchainProposalRequestSchema,
  OffchainProposalSearchRequestSchema,
  OffchainProposalsResponseSchema,
  OffchainProposalsLeanResponseSchema,
  OffchainProposalsRequestSchema,
  OffchainProposalMapper,
} from "@/mappers";
import { setCacheControl } from "@/middlewares";
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
      tags: ["offchain", "skip-pagination"],
      middleware: [setCacheControl(60)],
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
      const { skip, limit, orderDirection, status, fromDate, endDate } =
        context.req.valid("query");

      const response = await service.getProposals({
        skip,
        limit,
        orderDirection,
        status,
        fromDate,
        endDate,
      });

      return context.json(OffchainProposalsResponseSchema.parse(response), 200);
    },
  );

  app.openapi(
    createRoute({
      method: "get",
      operationId: "offchainSearchProposals",
      path: "/offchain/proposals/search",
      summary: "Search offchain proposals",
      description:
        "Returns offchain proposals whose title or identifier partially matches the query.",
      tags: ["offchain", "skip-pagination"],
      middleware: [setCacheControl(60)],
      request: {
        query: OffchainProposalSearchRequestSchema,
      },
      responses: {
        200: {
          description: "Successfully retrieved matching offchain proposals",
          content: {
            "application/json": {
              schema: OffchainProposalsResponseSchema,
            },
          },
        },
      },
    }),
    async (context) => {
      const { query, skip, limit } = context.req.valid("query");

      const response = await service.searchProposals({
        query,
        skip,
        limit,
      });

      return context.json(OffchainProposalsResponseSchema.parse(response), 200);
    },
  );

  app.openapi(
    createRoute({
      method: "get",
      operationId: "offchainProposalsLean",
      path: "/offchain/proposals/lean",
      summary: "Get offchain proposals (lean)",
      description:
        "Returns a list of offchain (Snapshot) proposals without the body field. Use this when the markdown body is not needed.",
      tags: ["offchain", "skip-pagination"],
      middleware: [setCacheControl(60)],
      request: {
        query: OffchainProposalsRequestSchema,
      },
      responses: {
        200: {
          description: "Successfully retrieved offchain proposals (lean)",
          content: {
            "application/json": {
              schema: OffchainProposalsLeanResponseSchema,
            },
          },
        },
      },
    }),
    async (context) => {
      const { skip, limit, orderDirection, status, fromDate, endDate } =
        context.req.valid("query");

      const { items, totalCount } = await service.getProposals({
        skip,
        limit,
        orderDirection,
        status,
        fromDate,
        endDate,
      });

      return context.json(
        {
          items: items.map((p) => OffchainProposalMapper.toLeanApi(p)),
          totalCount,
        },
        200,
      );
    },
  );

  app.openapi(
    createRoute({
      method: "get",
      operationId: "offchainSearchProposalsLean",
      path: "/offchain/proposals/lean/search",
      summary: "Search offchain proposals (lean)",
      description:
        "Returns matching offchain proposals without the body field.",
      tags: ["offchain", "skip-pagination"],
      middleware: [setCacheControl(60)],
      request: {
        query: OffchainProposalSearchRequestSchema,
      },
      responses: {
        200: {
          description:
            "Successfully retrieved matching offchain proposals (lean)",
          content: {
            "application/json": {
              schema: OffchainProposalsLeanResponseSchema,
            },
          },
        },
      },
    }),
    async (context) => {
      const { query, skip, limit } = context.req.valid("query");

      const { items, totalCount } = await service.searchProposals({
        query,
        skip,
        limit,
      });

      return context.json(
        {
          items: items.map((p) => OffchainProposalMapper.toLeanApi(p)),
          totalCount,
        },
        200,
      );
    },
  );

  app.openapi(
    createRoute({
      method: "get",
      operationId: "offchainProposalByIdLean",
      path: "/offchain/proposals/lean/{id}",
      summary: "Get an offchain proposal by ID (lean)",
      description:
        "Returns a single offchain (Snapshot) proposal by its ID without the body field.",
      tags: ["offchain"],
      middleware: [setCacheControl(60)],
      request: {
        params: OffchainProposalRequestSchema,
      },
      responses: {
        200: {
          description: "Successfully retrieved offchain proposal (lean)",
          content: {
            "application/json": {
              schema: OffchainProposalLeanResponseSchema,
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

      return context.json(
        OffchainProposalLeanResponseSchema.parse(
          OffchainProposalMapper.toLeanApi(proposal),
        ),
        200,
      );
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
      middleware: [setCacheControl(60)],
      request: {
        params: OffchainProposalRequestSchema,
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

      return context.json(OffchainProposalResponseSchema.parse(proposal), 200);
    },
  );
}
