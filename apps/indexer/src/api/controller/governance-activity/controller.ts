import { OpenAPIHono as Hono, createRoute, z } from "@hono/zod-openapi";

import { DaysEnum, DaysOpts } from "@/lib/enums";
import {
  ActiveSupplyQueryResult,
  ProposalsCompareQueryResult,
  VotesCompareQueryResult,
  AverageTurnoutCompareQueryResult,
} from "./types";
import { formatEther } from "viem";

interface GovernanceActivityRepository {
  getActiveSupply(days: DaysEnum): Promise<ActiveSupplyQueryResult | undefined>;
  getProposalsCompare(
    days: DaysEnum,
  ): Promise<ProposalsCompareQueryResult | undefined>;
  getVotesCompare(days: DaysEnum): Promise<VotesCompareQueryResult | undefined>;
  getAverageTurnoutCompare(
    days: DaysEnum,
  ): Promise<AverageTurnoutCompareQueryResult | undefined>;
}

export function governanceActivity(
  app: Hono,
  repository: GovernanceActivityRepository,
  tokenType: "ERC20" | "ERC721",
) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "compareActiveSupply",
      path: "/active-supply/compare",
      summary: "Get active token supply for DAO",
      tags: ["governance"],
      request: {
        query: z.object({
          days: z
            .enum(DaysOpts)
            .default("90d")
            .openapi({
              example: "90d",
            })
            .transform((val) => DaysEnum[val]),
        }),
      },
      responses: {
        200: {
          description: "Active supply value",
          content: {
            "application/json": {
              schema: z
                .object({
                  activeSupply: z.string(),
                })
                .openapi({
                  example: {
                    activeSupply: "1000000000000000000000000",
                  },
                }),
            },
          },
        },
      },
    }),
    async (context) => {
      const { days } = context.req.valid("query");
      const data = await repository.getActiveSupply(days);
      return context.json({ activeSupply: data?.activeSupply || "0" });
    },
  );

  app.openapi(
    createRoute({
      method: "get",
      operationId: "compareProposals",
      path: "/proposals/compare",
      summary: "Compare number of proposals between time periods",
      tags: ["governance"],
      request: {
        query: z.object({
          days: z
            .enum(DaysOpts)
            .default("90d")
            .transform((val) => DaysEnum[val]),
        }),
      },
      responses: {
        200: {
          description: "Proposal comparison",
          content: {
            "application/json": {
              schema: z.object({
                currentProposalsLaunched: z.number(),
                oldProposalsLaunched: z.number(),
                changeRate: z.number(),
              }),
            },
          },
        },
      },
    }),
    async (context) => {
      const { days } = context.req.valid("query");

      const data = await repository.getProposalsCompare(days);
      if (!data) {
        return context.json({
          currentProposalsLaunched: 0,
          oldProposalsLaunched: 0,
          changeRate: 0,
        });
      }
      const changeRate =
        data.oldProposalsLaunched &&
        data.currentProposalsLaunched / data.oldProposalsLaunched - 1;

      return context.json(
        {
          ...data,
          changeRate: changeRate ? Number(Number(changeRate).toFixed(2)) : 0,
        },
        200,
      );
    },
  );

  app.openapi(
    createRoute({
      method: "get",
      operationId: "compareVotes",
      path: "/votes/compare",
      summary: "Compare number of votes between time periods",
      tags: ["governance"],
      request: {
        query: z.object({
          days: z
            .enum(DaysOpts)
            .default("90d")
            .transform((val) => DaysEnum[val]),
        }),
      },
      responses: {
        200: {
          description: "Vote comparison",
          content: {
            "application/json": {
              schema: z.object({
                currentVotes: z.number(),
                oldVotes: z.number(),
                changeRate: z.number(),
              }),
            },
          },
        },
      },
    }),
    async (context) => {
      const { days } = context.req.valid("query");

      const data = await repository.getVotesCompare(days);
      if (!data) {
        return context.json({
          currentVotes: 0,
          oldVotes: 0,
          changeRate: 0,
        });
      }

      const changeRate = data.oldVotes && data.currentVotes / data.oldVotes - 1;

      return context.json(
        {
          ...data,
          changeRate: changeRate ? Number(Number(changeRate).toFixed(2)) : 0,
        },
        200,
      );
    },
  );

  app.openapi(
    createRoute({
      method: "get",
      operationId: "compareAverageTurnout",
      path: "/average-turnout/compare",
      summary: "Compare average turnout between time periods",
      tags: ["governance"],
      request: {
        query: z.object({
          days: z
            .enum(DaysOpts)
            .default("90d")
            .transform((val) => DaysEnum[val]),
        }),
      },
      responses: {
        200: {
          description: "Average turnout comparison",
          content: {
            "application/json": {
              schema: z.object({
                currentAverageTurnout: z.string(),
                oldAverageTurnout: z.string(),
                changeRate: z.number(),
              }),
            },
          },
        },
      },
    }),
    async (context) => {
      const { days } = context.req.valid("query");

      const data = await repository.getAverageTurnoutCompare(days);
      if (!data) {
        return context.json({
          currentAverageTurnout: "0",
          oldAverageTurnout: "0",
          changeRate: 0,
        });
      }

      if (tokenType === "ERC721") {
        return context.json(
          {
            ...data,
            changeRate:
              Number(data.oldAverageTurnout) > 0
                ? Number(data.currentAverageTurnout) /
                    Number(data.oldAverageTurnout) -
                  1
                : 0,
          },
          200,
        );
      }

      return context.json(
        {
          ...data,
          changeRate:
            Number(formatEther(BigInt(data.oldAverageTurnout))) > 0
              ? Number(formatEther(BigInt(data.currentAverageTurnout))) /
                  Number(formatEther(BigInt(data.oldAverageTurnout))) -
                1
              : 0,
        },
        200,
      );
    },
  );
}
