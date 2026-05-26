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
            rawDelta: 0,
          },
          200,
        );
      }
      const changeRate = data.oldProposalsLaunched
        ? Number(
            (
              data.currentProposalsLaunched / data.oldProposalsLaunched -
              1
            ).toFixed(6),
          )
        : 0;
      const rawDelta =
        data.currentProposalsLaunched - data.oldProposalsLaunched;

      return context.json({ ...data, changeRate, rawDelta }, 200);
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
            rawDelta: 0,
          },
          200,
        );
      }

      const changeRate = data.oldVotes
        ? Number((data.currentVotes / data.oldVotes - 1).toFixed(6))
        : 0;
      const rawDelta = data.currentVotes - data.oldVotes;

      return context.json({ ...data, changeRate, rawDelta }, 200);
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
            rawDelta: "0",
          },
          200,
        );
      }

      if (tokenType === "ERC721") {
        const currentInt = data.currentAverageTurnout?.split(".")[0] || "0";
        const oldInt = data.oldAverageTurnout?.split(".")[0] || "0";
        const oldNum = Number(data.oldAverageTurnout);
        const changeRate =
          oldNum > 0
            ? Number(
                (Number(data.currentAverageTurnout) / oldNum - 1).toFixed(6),
              )
            : 0;
        const rawDelta = (BigInt(currentInt) - BigInt(oldInt)).toString();
        return context.json(
          {
            currentAverageTurnout: currentInt,
            oldAverageTurnout: oldInt,
            changeRate,
            rawDelta,
          },
          200,
        );
      }

      // Repository can return decimal strings (e.g. "175.0000000000000000"
      // from SQL AVG()); BigInt only accepts integer strings, so trim the
      // fractional portion before raw-delta math.
      const currentBig = BigInt(
        data.currentAverageTurnout.split(".")[0] || "0",
      );
      const oldBig = BigInt(data.oldAverageTurnout.split(".")[0] || "0");
      const oldEth = Number(formatEther(oldBig));
      const changeRate =
        oldEth > 0
          ? Number((Number(formatEther(currentBig)) / oldEth - 1).toFixed(6))
          : 0;
      const rawDelta = (currentBig - oldBig).toString();

      return context.json({ ...data, changeRate, rawDelta }, 200);
    },
  );
}
