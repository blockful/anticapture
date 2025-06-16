import { OpenAPIHono as Hono, createRoute, z } from "@hono/zod-openapi";
import { Address, isAddress } from "viem";

import { DaoIdEnum } from "@/lib/enums";
import { caseInsensitiveEnum } from "../middlewares";
import {
  ProposalsActivityService,
  ProposalWithUserVote,
} from "@/api/services/proposals-activity/proposals-activity.service";
import {
  ProposalsActivityRepositoryInterface,
  DrizzleProposalsActivityRepository,
} from "@/api/repositories/proposals-activity.repository";

export function proposalsActivity(
  app: Hono,
  repository?: ProposalsActivityRepositoryInterface,
) {
  const proposalsRepository =
    repository || new DrizzleProposalsActivityRepository();
  const service = new ProposalsActivityService(proposalsRepository);

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
                totalProposals: z.number(),
                votedProposals: z.number(),
                neverVoted: z.boolean(),
                winRate: z.number(),
                yesRate: z.number(),
                avgTimeBeforeEnd: z.number(),
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
                      forVotes: z.number(), // default 0
                      againstVotes: z.number(), // default 0
                      abstainVotes: z.number(), // default 0
                    }),
                    userVote: z
                      .object({
                        id: z.string(),
                        voterAccountId: z.string(),
                        proposalId: z.string(),
                        support: z.string().nullable(),
                        votingPower: z.string().default("0"),
                        reason: z.string().nullable(),
                        timestamp: z.string(),
                      })
                      .nullable(),
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

      const result = await service.getProposalsActivity({
        address,
        fromDate,
        daoId,
        skip,
        limit,
      });

      return context.json(result, 200);
    },
  );
}
