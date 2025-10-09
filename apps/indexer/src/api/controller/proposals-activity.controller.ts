import { OpenAPIHono as Hono, createRoute, z } from "@hono/zod-openapi";
import { isAddress } from "viem";

import { DaoIdEnum } from "@/lib/enums";
import { ProposalsActivityService } from "@/api/services";
import { ProposalsActivityRepository } from "@/api/repositories/proposals-activity.repository";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { VoteFilter } from "@/api/repositories/proposals-activity.repository";
import { DAOClient } from "@/interfaces/client";

export function proposalsActivity(
  app: Hono,
  repository: ProposalsActivityRepository,
  daoId: DaoIdEnum,
  daoClient: DAOClient,
) {
  const service = new ProposalsActivityService(repository, daoClient);

  app.openapi(
    createRoute({
      method: "get",
      operationId: "proposalsActivity",
      path: "/proposals-activity",
      summary: "Get proposals activity for delegate",
      description:
        "Returns proposal activity data including voting history, win rates, and detailed proposal information for the specified delegate within the given time window",
      tags: ["proposals-activity"],
      request: {
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
          orderBy: z
            .enum(["timestamp", "votingPower", "voteTiming"])
            .default("timestamp")
            .optional(),
          orderDirection: z.enum(["asc", "desc"]).default("desc").optional(),
          userVoteFilter: z
            .nativeEnum(VoteFilter)
            .optional()
            .describe(
              "Filter proposals by vote type. Can be: 'yes' (For votes), 'no' (Against votes), 'abstain' (Abstain votes), 'no-vote' (Didn't vote)",
            ),
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
                      startBlock: z.number(),
                      endBlock: z.number(),
                      timestamp: z.string(),
                      status: z.string(),
                      forVotes: z.string(),
                      againstVotes: z.string(),
                      abstainVotes: z.string(),
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
      const {
        address,
        fromDate,
        skip,
        limit,
        orderBy,
        orderDirection,
        userVoteFilter,
      } = context.req.valid("query");

      const blockTime = CONTRACT_ADDRESSES[daoId].blockTime;

      const result = await service.getProposalsActivity({
        address,
        fromDate,
        daoId,
        skip,
        limit,
        blockTime,
        orderBy,
        orderDirection,
        userVoteFilter,
      });

      return context.json(result, 200);
    },
  );
}
