import { OpenAPIHono as Hono, createRoute, z } from "@hono/zod-openapi";
import { getAddress, isAddress } from "viem";

import { DaoIdEnum } from "@/lib/enums";
import { ProposalsActivityService } from "@/api/services";
import { ProposalsActivityRepository, VoteFilter } from "@/api/repositories/";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { DAOClient } from "@/interfaces/client";
import { ProposalActivityResponseSchema } from "@/api/mappers";

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
            .refine(
              (addr) => isAddress(addr, { strict: false }),
              "Invalid Ethereum address",
            )
            .transform((addr) => getAddress(addr)),
          fromDate: z
            .string()
            .transform((val) => Number(val))
            .optional(),
          skip: z.coerce
            .number()
            .int()
            .min(0, "Skip must be a non-negative integer")
            .optional()
            .default(0),
          limit: z.coerce
            .number()
            .int()
            .min(1, "Limit must be a positive integer")
            .max(100, "Limit cannot exceed 100")
            .optional()
            .default(10),
          orderBy: z
            .enum(["timestamp", "votingPower", "voteTiming"])
            .optional()
            .default("timestamp"),
          orderDirection: z.enum(["asc", "desc"]).optional().default("desc"),
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
              schema: ProposalActivityResponseSchema,
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

      return context.json(ProposalActivityResponseSchema.parse(result));
    },
  );
}
