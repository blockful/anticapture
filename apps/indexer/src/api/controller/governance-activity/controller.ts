import { OpenAPIHono as Hono, createRoute, z } from "@hono/zod-openapi";

import { DaysEnum, DaysOpts } from "@/lib/daysEnum";
import { DaoIdEnum } from "@/lib/enums";
import { caseInsensitiveEnum } from "../../middlewares";
import {
  ActiveSupplyQueryResult,
  ProposalsCompareQueryResult,
  VotesCompareQueryResult,
  AverageTurnoutCompareQueryResult,
} from "./types";

interface GovernanceActivityRepository {
  getActiveSupply(
    daoId: string,
    days: number,
  ): Promise<ActiveSupplyQueryResult>;
  getProposalsCompare(
    daoId: string,
    days: number,
  ): Promise<ProposalsCompareQueryResult>;
  getVotesCompare(
    daoId: string,
    days: number,
  ): Promise<VotesCompareQueryResult>;
  getAverageTurnoutCompare(
    daoId: string,
    days: number,
  ): Promise<AverageTurnoutCompareQueryResult>;
}

export function governanceActivity(
  app: Hono,
  repository: GovernanceActivityRepository,
) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "compareActiveSupply",
      path: "/dao/:daoId/active-supply/compare",
      summary: "Get active token supply for DAO",
      tags: ["governance"],
      request: {
        params: z.object({
          daoId: caseInsensitiveEnum(DaoIdEnum).openapi({
            example: "ens",
          }),
        }),
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
      const { daoId } = context.req.valid("param");
      const { days } = context.req.valid("query");
      const data = await repository.getActiveSupply(daoId, days);
      return context.json({ activeSupply: data.activeSupply });
    },
  );

  // app.openapi(
  //   createRoute({
  //     method: "get",
  //     operationId: "compareProposals",
  //     path: "/dao/:daoId/proposals/compare",
  //     summary: "Compare number of proposals between time periods",
  //     tags: ["governance"],
  //     request: {
  //       params: z.object({
  //         daoId: caseInsensitiveEnum(DaoIdEnum),
  //       }),
  //       query: z.object({
  //         days: z
  //           .enum(DaysOpts)
  //           .default("90d")
  //           .transform((val) => DaysEnum[val]),
  //       }),
  //     },
  //     responses: {
  //       200: {
  //         description: "Proposal comparison",
  //         content: {
  //           "application/json": {
  //             schema: z.object({
  //               currentProposalsLaunched: z.string(),
  //               oldProposalsLaunched: z.string(),
  //               changeRate: z.number(),
  //             }),
  //           },
  //         },
  //       },
  //     },
  //   }),
  //   async (context) => {
  //     const { daoId } = context.req.valid("param");
  //     const { days } = context.req.valid("query");

  //     const data = await repository.getProposalsCompare(daoId, days);
  //     const changeRate =
  //       data.oldProposalsLaunched === "0"
  //         ? 0
  //         : parseFloat(data.currentProposalsLaunched) /
  //         parseFloat(data.oldProposalsLaunched) -
  //         1;

  //     return context.json({ ...data, changeRate });
  //   },
  // );

  // app.openapi(
  //   createRoute({
  //     method: "get",
  //     operationId: "compareVotes",
  //     path: "/dao/:daoId/votes/compare",
  //     summary: "Compare number of votes between time periods",
  //     tags: ["governance"],
  //     request: {
  //       params: z.object({
  //         daoId: caseInsensitiveEnum(DaoIdEnum),
  //       }),
  //       query: z.object({
  //         days: z
  //           .enum(DaysOpts)
  //           .default("90d")
  //           .transform((val) => DaysEnum[val]),
  //       }),
  //     },
  //     responses: {
  //       200: {
  //         description: "Vote comparison",
  //         content: {
  //           "application/json": {
  //             schema: z.object({
  //               currentVotes: z.string(),
  //               oldVotes: z.string(),
  //               changeRate: z.number(),
  //             }),
  //           },
  //         },
  //       },
  //     },
  //   }),
  //   async (context) => {
  //     const { daoId } = context.req.valid("param");
  //     const { days } = context.req.valid("query");

  //     const data = await repository.getVotesCompare(daoId, days);

  //     const changeRate =
  //       data.oldVotes === "0"
  //         ? 0
  //         : parseFloat(data.currentVotes) / parseFloat(data.oldVotes) - 1;

  //     return context.json({ ...data, changeRate }, 200);
  //   },
  // );

  // app.openapi(
  //   createRoute({
  //     method: "get",
  //     operationId: "compareAverageTurnout",
  //     path: "/dao/:daoId/average-turnout/compare",
  //     summary: "Compare average turnout between time periods",
  //     tags: ["governance"],
  //     request: {
  //       params: z.object({
  //         daoId: caseInsensitiveEnum(DaoIdEnum),
  //       }),
  //       query: z.object({
  //         days: z
  //           .enum(DaysOpts)
  //           .default("90d")
  //           .transform((val) => DaysEnum[val]),
  //       }),
  //     },
  //     responses: {
  //       200: {
  //         description: "Average turnout comparison",
  //         content: {
  //           "application/json": {
  //             schema: z.object({
  //               currentAverageTurnout: z.string(),
  //               oldAverageTurnout: z.string(),
  //               changeRate: z.number(),
  //             }),
  //           },
  //         },
  //       },
  //     },
  //   }),
  //   async (context) => {
  //     const { daoId } = context.req.valid("param");
  //     const { days } = context.req.valid("query");

  //     const data = await repository.getAverageTurnoutCompare(daoId, days);
  //     const changeRate =
  //       data.oldAverageTurnout === "0"
  //         ? 0
  //         : parseFloat(data.currentAverageTurnout) /
  //         parseFloat(data.oldAverageTurnout) -
  //         1;

  //     return context.json({ ...data, changeRate });
  //   },
  // );
}
