import { OpenAPIHono as Hono } from "@hono/zod-openapi";
import { createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import { sql } from "ponder";
import { db } from "ponder:api";

import { DaysEnum, DaysOpts } from "@/lib/daysEnum";
import { DaoIdEnum } from "@/lib/enums";
import { caseInsensitiveEnum } from "../../middlewares";
import {
  ActiveSupplyQueryResult,
  ProposalsCompareQueryResult,
  VotesCompareQueryResult,
  AverageTurnoutCompareQueryResult,
} from "./types";
import { convertTimestampMilissecondsToSeconds } from "@/lib/utils";

export function governanceActivity(app: Hono) {
  app.openapi(
    createRoute({
      method: "get",
      path: "/dao/{daoId}/active-supply",
      summary: "Get active token supply for DAO",
      tags: ["governance"],
      request: {
        params: z.object({
          daoId: caseInsensitiveEnum(DaoIdEnum),
        }),
        query: z.object({
          days: z
            .enum(DaysOpts)
            .default("90d")
            .transform((val) => DaysEnum[val]),
        }),
      },
      responses: {
        200: {
          description: "Active supply value",
          content: {
            "application/json": {
              schema: z.object({
                activeSupply: z.string(),
              }),
            },
          },
        },
      },
    }),
    async (context) => {
      const { daoId } = context.req.valid("param");
      const { days } = context.req.valid("query");

      const oldTimestamp = BigInt(Date.now()) - BigInt(days);

      const result = await db.execute(sql`
        SELECT COALESCE(SUM(ap."voting_power"), 0) as "activeSupply"
        FROM "account_power" ap
        WHERE ap."last_vote_timestamp" > CAST(${oldTimestamp.toString().slice(0, 10)} as bigint)
        AND ap."dao_id" = ${daoId}
      `);

      const data = result.rows[0] as ActiveSupplyQueryResult;

      return context.json({ activeSupply: data.activeSupply });
    },
  );

  app.openapi(
    createRoute({
      method: "get",
      path: "/dao/{daoId}/proposals/compare",
      summary: "Compare number of proposals between time periods",
      tags: ["governance"],
      request: {
        params: z.object({
          daoId: caseInsensitiveEnum(DaoIdEnum),
        }),
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
                currentProposalsLaunched: z.string(),
                oldProposalsLaunched: z.string(),
                changeRate: z.number(),
              }),
            },
          },
        },
      },
    }),
    async (context) => {
      const { daoId } = context.req.valid("param");
      const { days } = context.req.valid("query");

      const oldBegin =
        BigInt(Date.now()) - BigInt(days) - BigInt(DaysEnum["180d"]);
      const oldEnd = BigInt(Date.now()) - BigInt(days);
      const currentBegin = BigInt(Date.now()) - BigInt(DaysEnum["180d"]);

      const result = await db.execute(sql`
        WITH old_proposals AS (
          SELECT COUNT(*) AS "old_proposals_launched"
          FROM "proposals_onchain" p 
          WHERE p.dao_id=${daoId}
          AND p.timestamp BETWEEN CAST(${oldBegin.toString().slice(0, 10)} as bigint)
          AND CAST(${oldEnd.toString().slice(0, 10)} as bigint)
        ),
        current_proposals AS (
          SELECT COUNT(*) AS "current_proposals_launched"
          FROM "proposals_onchain" p
          WHERE p.dao_id=${daoId}
          AND p.timestamp > CAST(${currentBegin.toString().slice(0, 10)} as bigint)
        )
        SELECT current_proposals."current_proposals_launched",
               old_proposals."old_proposals_launched"
        FROM current_proposals
        JOIN old_proposals ON 1=1;
      `);

      const data = result.rows[0] as ProposalsCompareQueryResult;

      const changeRate =
        data.oldProposalsLaunched === "0"
          ? 0
          : parseFloat(data.currentProposalsLaunched) /
          parseFloat(data.oldProposalsLaunched) -
          1;

      return context.json({ ...data, changeRate });
    },
  );

  app.openapi(
    createRoute({
      method: "get",
      path: "/dao/{daoId}/votes/compare",
      summary: "Compare number of votes between time periods",
      tags: ["governance"],
      request: {
        params: z.object({
          daoId: caseInsensitiveEnum(DaoIdEnum),
        }),
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
                currentVotes: z.string(),
                oldVotes: z.string(),
                changeRate: z.number(),
              }),
            },
          },
        },
      },
    }),
    async (context) => {
      const { daoId } = context.req.valid("param");
      const { days } = context.req.valid("query");

      const oldBegin =
        BigInt(Date.now()) - BigInt(days) - BigInt(DaysEnum["180d"]);
      const oldEnd = BigInt(Date.now()) - BigInt(days);
      const currentBegin = BigInt(Date.now()) - BigInt(DaysEnum["180d"]);

      const result = await db.execute(sql`
        WITH old_votes AS (
          SELECT COUNT(*) AS "old_votes"
          FROM "votes_onchain" v 
          WHERE v.dao_id=${daoId}
          AND v.timestamp BETWEEN CAST(${convertTimestampMilissecondsToSeconds(oldBegin)} as bigint)
          AND CAST(${convertTimestampMilissecondsToSeconds(oldEnd)} as bigint)
        ),
        current_votes AS (
          SELECT COUNT(*) AS "current_votes"
          FROM "votes_onchain" v
          WHERE v.dao_id=${daoId}
          AND v.timestamp > CAST(${convertTimestampMilissecondsToSeconds(currentBegin)} as bigint)
        )
        SELECT current_votes."current_votes",
               old_votes."old_votes"
        FROM current_votes
        JOIN old_votes ON 1=1;
      `);

      const data = result.rows[0] as VotesCompareQueryResult;

      const changeRate =
        data.oldVotes === "0"
          ? 0
          : parseFloat(data.currentVotes) / parseFloat(data.oldVotes) - 1;

      return context.json({ ...data, changeRate });
    },
  );

  app.openapi(
    createRoute({
      method: "get",
      path: "/dao/{daoId}/average-turnout/compare",
      summary: "Compare average turnout between time periods",
      tags: ["governance"],
      request: {
        params: z.object({
          daoId: caseInsensitiveEnum(DaoIdEnum),
        }),
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
      const { daoId } = context.req.valid("param");
      const { days } = context.req.valid("query");

      const interval = BigInt(DaysEnum["180d"]);
      const votingWindow = BigInt(DaysEnum["7d"]);
      const oldBegin = BigInt(Date.now()) - BigInt(days) - interval;
      const oldEnd = BigInt(Date.now()) - BigInt(days) - votingWindow;
      const currentBegin = BigInt(Date.now()) - interval;
      const currentEnd = BigInt(Date.now()) - votingWindow;

      const result = await db.execute(sql`
        WITH old_average_turnout AS (
          SELECT AVG(po."for_votes" + po."against_votes" + po."abstain_votes") AS "average_turnout"
          FROM "proposals_onchain" po
          WHERE po.timestamp BETWEEN CAST(${convertTimestampMilissecondsToSeconds(oldBegin)} as bigint)
          AND CAST(${convertTimestampMilissecondsToSeconds(oldEnd)} as bigint)
          AND po.status != 'CANCELED' AND po."dao_id" = ${daoId}
        ),
        current_average_turnout AS (
          SELECT AVG(po."for_votes" + po."against_votes" + po."abstain_votes") AS "average_turnout"
          FROM "proposals_onchain" po
          WHERE po.timestamp BETWEEN CAST(${convertTimestampMilissecondsToSeconds(currentBegin)} as bigint)
          AND CAST(${convertTimestampMilissecondsToSeconds(currentEnd)} as bigint)
          AND po.status != 'CANCELED' AND po."dao_id" = ${daoId}
        )
        SELECT old_average_turnout."average_turnout" AS "oldAverageTurnout",
               current_average_turnout."average_turnout" AS "currentAverageTurnout"
        FROM current_average_turnout
        JOIN old_average_turnout ON 1=1;
      `);

      const data = result.rows[0] as AverageTurnoutCompareQueryResult;

      const changeRate =
        data.oldAverageTurnout === "0"
          ? 0
          : parseFloat(data.currentAverageTurnout) /
          parseFloat(data.oldAverageTurnout) -
          1;

      return context.json({ ...data, changeRate });
    },
  );
}
