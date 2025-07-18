import { OpenAPIHono as Hono, createRoute, z } from "@hono/zod-openapi";
import { isAddress } from "viem";

import { DaoIdEnum } from "@/lib/enums";
import { caseInsensitiveEnum } from "../middlewares";
import { ProposalsActivityService } from "@/api/services/proposals-activity/proposals-activity.service";
import { ProposalsActivityRepository } from "@/api/repositories/proposals-activity.repository";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { ProposalSchema } from "@/api/mappers/proposals";
import {
  ProposalActivityRequestSchema,
  ProposalActivityResponseSchema,
} from "@/api/mappers/proposalActivity";

export function proposalsActivity(
  app: Hono,
  repository: ProposalsActivityRepository,
) {
  const service = new ProposalsActivityService(repository);

  app.openapi(
    createRoute({
      method: "get",
      operationId: "proposalsActivity",
      path: "/proposals-activity/{daoId}",
      summary: "Get proposals activity for delegate",
      description:
        "Returns proposal activity data including voting history, win rates, and detailed proposal information for the specified delegate within the given time window",
      tags: ["proposals-activity"],
      request: {
        params: z.object({
          daoId: caseInsensitiveEnum(DaoIdEnum),
        }),
        query: ProposalActivityRequestSchema,
      },
      responses: {
        200: {
          description: "Successfully retrieved proposals activity",
          content: {
            "application/json": {
              schema: ProposalActivityResponseSchema,
            },
          },
        },
      },
    }),
    async (context) => {
      const { daoId } = context.req.valid("param");
      const { address, fromDate, skip, limit } = context.req.valid("query");

      const blockTime = CONTRACT_ADDRESSES[daoId].blockTime;

      const result = await service.getProposalsActivity({
        address,
        fromDate,
        daoId,
        skip,
        limit,
        blockTime,
      });

      return context.json(result, 200);
    },
  );

  app.openapi(
    createRoute({
      method: "get",
      operationId: "proposals",
      path: "/proposals/{id}",
      summary: "Get proposal by id",
      description: "Returns proposal data for the specified proposal id",
      tags: ["proposals"],
      request: {
        params: z.object({
          id: z.string(),
        }),
      },
      responses: {
        200: {
          description: "Successfully retrieved proposal",
          content: {
            "application/json": {
              schema: ProposalSchema,
            },
          },
        },
        404: {
          description: "Proposal not found",
          content: {
            "application/json": {
              schema: z.object({
                error: z.string(),
              }),
            },
          },
        },
      },
    }),
    async (context) => {
      const { id } = context.req.valid("param");

      const result = await service.getProposalById(id);
      if (!result) {
        return context.json({ error: "Proposal not found" }, 404);
      }

      return context.json(result, 200);
    },
  );

  app.openapi(
    createRoute({
      method: "get",
      operationId: "proposals",
      path: "/proposals",
      summary: "Get proposals",
      description: "Returns proposals",
      tags: ["proposals"],
      request: {
        query: z.object({
          limit: z.coerce
            .number()
            .int()
            .min(1)
            .max(100, "Limit cannot exceed 100")
            .optional()
            .default(10),
          skip: z.coerce.number().int().min(0).optional().default(0),
        }),
      },
      responses: {
        200: {
          description: "Successfully retrieved proposals",
          content: {
            "application/json": {
              schema: z.array(ProposalSchema),
            },
          },
        },
      },
    }),
    async (context) => {
      const { limit, skip } = context.req.valid("query");
      const result = await service.getProposals(limit, skip);
      return context.json(result);
    },
  );
}
