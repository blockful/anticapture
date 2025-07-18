import { OpenAPIHono as Hono, createRoute, z } from "@hono/zod-openapi";
import { isAddress } from "viem";

import { DaoIdEnum } from "@/lib/enums";
import { caseInsensitiveEnum } from "../middlewares";
import { ProposalsActivityService } from "@/api/services/proposals-activity/proposals-activity.service";
import { ProposalsActivityRepository } from "@/api/repositories/proposals-activity.repository";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { ProposalSchema } from "@/api/mappers/proposals";

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
        query: z.object({
          address: z
            .string()
            .refine((addr) => isAddress(addr), "Invalid Ethereum address"),
          fromDate: z.coerce
            .number()
            .int()
            .positive("From date must be a positive timestamp")
            .optional(),
          skip: z.coerce
            .number()
            .int()
            .min(0, "Skip must be a non-negative integer")
            .default(0)
            .optional(),
          limit: z.coerce
            .number()
            .int()
            .min(1, "Limit must be a positive integer")
            .max(100, "Limit cannot exceed 100")
            .default(10)
            .optional(),
        }),
      },
      responses: {
        200: {
          description: "Successfully retrieved proposals activity",
          content: {
            "application/json": {
              schema: z.object({
                address: z.string(),
                totalProposals: z.number().optional().default(0),
                votedProposals: z.number().optional().default(0),
                neverVoted: z.boolean().optional().default(false),
                winRate: z.number().optional().default(0),
                yesRate: z.number().optional().default(0),
                avgTimeBeforeEnd: z.number().optional().default(0),
                proposals: z.array(
                  z.object({
                    proposal: z.object({
                      id: z.string(),
                      daoId: z.string(),
                      proposerAccountId: z.string(),
                      description: z.string().nullable(),
                      startBlock: z.string(),
                      endBlock: z.string(),
                      timestamp: z.string(),
                      status: z.string(),
                      forVotes: z.string(),
                      againstVotes: z.string(),
                      abstainVotes: z.string(),
                      votes: z.array(
                        z.object({
                          id: z.string(),
                          voterAccountId: z.string(),
                          support: z.string().nullable(),
                          votingPower: z.string().default("0"),
                          reason: z.string().nullable(),
                          timestamp: z.string(),
                        }),
                      ),
                    }),
                  }),
                ),
              }),
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
