import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";

import {
  ErrorResponseSchema,
  OffchainProposalByIdQuerySchema,
  OffchainProposalResponseSchema,
  OffchainProposalRequestSchema,
  OffchainProposalSearchRequestSchema,
  OffchainProposalsResponseSchema,
  OffchainProposalsRequestSchema,
  OffchainProposalMapper,
} from "@/mappers";
import { setCacheControl } from "@/middlewares";
import { OffchainProposalsService } from "@/services";

export function offchainProposals(
  app: Hono,
  service: OffchainProposalsService,
  supportOffchain: boolean,
) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "offchainProposals",
      path: "/offchain/proposals",
      summary: "Get offchain proposals",
      description:
        "Returns a list of offchain (Snapshot) proposals. Pass `lean=true` to omit the markdown `body` and reduce payload size.",
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
        400: {
          description: "Offchain data not supported",
          content: {
            "application/json": {
              schema: ErrorResponseSchema,
            },
          },
        },
      },
    }),
    async (context) => {
      if (!supportOffchain) {
        return context.json(
          ErrorResponseSchema.parse({ error: "Offchain data not supported" }),
          400,
        );
      }

      const { skip, limit, orderDirection, status, fromDate, endDate, lean } =
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
          items: items.map((p) => OffchainProposalMapper.toApi(p, { lean })),
          totalCount,
        },
        200,
      );
    },
  );

  app.openapi(
    createRoute({
      method: "get",
      operationId: "offchainSearchProposals",
      path: "/offchain/proposals/search",
      summary: "Search offchain proposals",
      description:
        "Returns offchain proposals whose title or identifier partially matches the query. Pass `lean=true` to omit the `body`.",
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
      const { query, skip, limit, lean } = context.req.valid("query");

      const { items, totalCount } = await service.searchProposals({
        query,
        skip,
        limit,
      });

      return context.json(
        {
          items: items.map((p) => OffchainProposalMapper.toApi(p, { lean })),
          totalCount,
        },
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
      description:
        "Returns a single offchain (Snapshot) proposal by its ID. Pass `lean=true` to omit the `body`.",
      tags: ["offchain"],
      middleware: [setCacheControl(60)],
      request: {
        params: OffchainProposalRequestSchema,
        query: OffchainProposalByIdQuerySchema,
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
      const { lean } = context.req.valid("query");

      const proposal = await service.getProposalById(id);

      if (!proposal) {
        return context.json(
          ErrorResponseSchema.parse({ error: "Proposal not found" }),
          404,
        );
      }

      return context.json(
        OffchainProposalMapper.toApi(proposal, { lean }),
        200,
      );
    },
  );
}
