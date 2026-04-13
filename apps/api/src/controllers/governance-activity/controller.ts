import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";
import { formatEther } from "viem";

import { DaysEnum } from "@/lib/enums";
import { setCacheControl } from "@/middlewares";
import {
  ActiveSupplyResponseSchema,
  AverageTurnoutComparisonResponseSchema,
  GovernanceActivityDaysQuerySchema,
  ProposalsComparisonResponseSchema,
  VotesComparisonResponseSchema,
} from "@/mappers";

import {
  ActiveSupplyQueryResult,
  ProposalsCompareQueryResult,
  VotesCompareQueryResult,
  AverageTurnoutCompareQueryResult,
} from "./types";

export interface GovernanceActivityRepository {
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
      middleware: [setCacheControl(60)],
      request: {
        query: GovernanceActivityDaysQuerySchema,
      },
      responses: {
        200: {
          description: "Active supply value",
          content: {
            "application/json": {
              schema: ActiveSupplyResponseSchema,
            },
          },
        },
      },
    }),
    async (context) => {
      const { days } = context.req.valid("query");
      const data = await repository.getActiveSupply(days);
      return context.json({ activeSupply: data?.activeSupply || "0" }, 200);
    },
  );

  app.openapi(
    createRoute({
      method: "get",
      operationId: "compareProposals",
      path: "/proposals/compare",
      summary: "Compare number of proposals between time periods",
      tags: ["governance"],
      middleware: [setCacheControl(60)],
      request: {
        query: GovernanceActivityDaysQuerySchema,
      },
      responses: {
        200: {
          description: "Proposal comparison",
          content: {
            "application/json": {
              schema: ProposalsComparisonResponseSchema,
            },
          },
        },
      },
    }),
    async (context) => {
      const { days } = context.req.valid("query");

      const data = await repository.getProposalsCompare(days);
      if (!data) {
        return context.json(
          {
            currentProposalsLaunched: 0,
            oldProposalsLaunched: 0,
            changeRate: 0,
          },
          200,
        );
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
      middleware: [setCacheControl(60)],
      request: {
        query: GovernanceActivityDaysQuerySchema,
      },
      responses: {
        200: {
          description: "Vote comparison",
          content: {
            "application/json": {
              schema: VotesComparisonResponseSchema,
            },
          },
        },
      },
    }),
    async (context) => {
      const { days } = context.req.valid("query");

      const data = await repository.getVotesCompare(days);
      if (!data) {
        return context.json(
          {
            currentVotes: 0,
            oldVotes: 0,
            changeRate: 0,
          },
          200,
        );
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
      middleware: [setCacheControl(60)],
      request: {
        query: GovernanceActivityDaysQuerySchema,
      },
      responses: {
        200: {
          description: "Average turnout comparison",
          content: {
            "application/json": {
              schema: AverageTurnoutComparisonResponseSchema,
            },
          },
        },
      },
    }),
    async (context) => {
      const { days } = context.req.valid("query");

      const data = await repository.getAverageTurnoutCompare(days);
      if (!data) {
        return context.json(
          {
            currentAverageTurnout: "0",
            oldAverageTurnout: "0",
            changeRate: 0,
          },
          200,
        );
      }

      if (tokenType === "ERC721") {
        return context.json(
          {
            currentAverageTurnout:
              data.currentAverageTurnout?.split(".")[0] || "0",
            oldAverageTurnout: data.oldAverageTurnout?.split(".")[0] || "0",
            changeRate: data.oldAverageTurnout
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
