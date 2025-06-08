import { OpenAPIHono as Hono, createRoute, z } from "@hono/zod-openapi";
import { Address } from "viem";

import { DaoIdEnum } from "@/lib/enums";
import { caseInsensitiveEnum } from "../middlewares";
import {
  ProposalsActivityService,
  ProposalWithUserVote,
} from "@/api/services/proposals-activity/proposals-activity.service";

// Response schema
const ProposalWithUserVoteSchema = z.object({
  proposal: z.object({
    id: z.string(),
    daoId: z.string(),
    proposerAccountId: z.string(),
    description: z.string().nullable(),
    startBlock: z.string().nullable(),
    endBlock: z.string().nullable(),
    timestamp: z.string().nullable(),
    status: z.string().nullable(),
    forVotes: z.string().nullable(),
    againstVotes: z.string().nullable(),
    abstainVotes: z.string().nullable(),
  }),
  userVote: z
    .object({
      id: z.string(),
      voterAccountId: z.string(),
      proposalId: z.string(),
      support: z.string().nullable(),
      votingPower: z.string().nullable(),
      reason: z.string().nullable(),
      timestamp: z.string().nullable(),
    })
    .nullable(),
});



export function proposalsActivity(app: Hono) {
  const service = new ProposalsActivityService();

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
            .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address")
            .transform((addr) => addr.trim() as Address),
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
                data: z.object({
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
                        startBlock: z.string().nullable(),
                        endBlock: z.string().nullable(),
                        timestamp: z.string().nullable(),
                        status: z.string().nullable(),
                        forVotes: z.string().nullable(),
                        againstVotes: z.string().nullable(),
                        abstainVotes: z.string().nullable(),
                      }),
                      userVote: z
                        .object({
                          id: z.string(),
                          voterAccountId: z.string(),
                          proposalId: z.string(),
                          support: z.string().nullable(),
                          votingPower: z.string().nullable(),
                          reason: z.string().nullable(),
                          timestamp: z.string().nullable(),
                        })
                        .nullable(),
                    }),
                  ),
                }),
              }),
            },
          },
        },
        400: {
          description: "Bad request - validation error",
          content: {
            "application/json": {
              schema: z.object({
                error: z.string(),
                message: z.string(),
                details: z.any().optional(),
              }),
            },
          },
        },
        500: {
          description: "Internal server error",
          content: {
            "application/json": {
              schema: z.object({
                error: z.string(),
                message: z.string(),
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

      // Convert BigInt values to strings for JSON serialization
      const serializedResult = {
        ...result,
        proposals: result.proposals.map((item: ProposalWithUserVote) => ({
          proposal: {
            ...item.proposal,
            timestamp: item.proposal.timestamp?.toString() || null,
            forVotes: item.proposal.forVotes?.toString() || null,
            againstVotes: item.proposal.againstVotes?.toString() || null,
            abstainVotes: item.proposal.abstainVotes?.toString() || null,
          },
          userVote: item.userVote
            ? {
                ...item.userVote,
                timestamp: item.userVote.timestamp?.toString() || null,
              }
            : null,
        })),
      };

      const response = {
        data: serializedResult,
      };

      return context.json(response, 200);
    },
  );
}
