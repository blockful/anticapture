import { OpenAPIHono as Hono } from "@hono/zod-openapi";
import { createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import { sql } from "ponder";
import { db } from "ponder:api";
import { formatUnits } from "viem";

import { DaysEnum, DaysOpts } from "@/lib/daysEnum";
import { MetricTypesEnum } from "@/lib/constants";
import { DaoIdEnum } from "@/lib/enums";
import { caseInsensitiveEnum } from "@/api/middlewares";

export function tokenDistribution(app: Hono) {
  const routes = [
    {
      path: "total-supply",
      metric: MetricTypesEnum.TOTAL_SUPPLY,
      resultKey: "TotalSupply",
      resultSchema: z.object({
        oldTotalSupply: z.string(),
        currentTotalSupply: z.string(),
        changeRate: z.string(),
      }),
    },
    {
      path: "delegated-supply",
      metric: MetricTypesEnum.DELEGATED_SUPPLY,
      resultKey: "DelegatedSupply",
      resultSchema: z.object({
        oldDelegatedSupply: z.string(),
        currentDelegatedSupply: z.string(),
        changeRate: z.string(),
      }),
    },
    {
      path: "circulating-supply",
      metric: MetricTypesEnum.CIRCULATING_SUPPLY,
      resultKey: "CirculatingSupply",
      resultSchema: z.object({
        oldCirculatingSupply: z.string(),
        currentCirculatingSupply: z.string(),
        changeRate: z.string(),
      }),
    },
    {
      path: "treasury",
      metric: MetricTypesEnum.TREASURY,
      resultKey: "Treasury",
      resultSchema: z.object({
        oldTreasury: z.string(),
        currentTreasury: z.string(),
        changeRate: z.string(),
      }),
    },
    {
      path: "cex-supply",
      metric: MetricTypesEnum.CEX_SUPPLY,
      resultKey: "CexSupply",
      resultSchema: z.object({
        oldCexSupply: z.string(),
        currentCexSupply: z.string(),
        changeRate: z.string(),
      }),
    },
    {
      path: "dex-supply",
      metric: MetricTypesEnum.DEX_SUPPLY,
      resultKey: "DexSupply",
      resultSchema: z.object({
        oldDexSupply: z.string(),
        currentDexSupply: z.string(),
        changeRate: z.string(),
      }),
    },
    {
      path: "lending-supply",
      metric: MetricTypesEnum.LENDING_SUPPLY,
      resultKey: "LendingSupply",
      resultSchema: z.object({
        oldLendingSupply: z.string(),
        currentLendingSupply: z.string(),
        changeRate: z.string(),
      }),
    },
  ];

  for (const { path, metric, resultKey, resultSchema } of routes) {
    app.openapi(
      createRoute({
        method: "get",
        path: `/dao/{daoId}/${path}/compare`,
        summary: `Compare ${path.replace(/-/g, " ")} between periods`,
        tags: ["token"],
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
            description: `${path.replace(/-/g, " ")} comparison`,
            content: {
              "application/json": { schema: resultSchema },
            },
          },
        },
      }),
      async (ctx) => {
        const { daoId } = ctx.req.valid("param");
        const { days } = ctx.req.valid("query");
        const oldTimestamp = BigInt(Date.now()) - BigInt(days);

        const query = sql`
        WITH  "old_total_supply" as (
          SELECT db.average as old_total_supply_amount from "dao_metrics_day_buckets" db 
          WHERE db.dao_id=${daoId} 
          AND db."metricType"=${MetricTypesEnum.TOTAL_SUPPLY}
          AND db."date">=CAST(${oldTimestamp.toString().slice(0, 10)} as bigint)
          ORDER BY db."date" ASC LIMIT 1
        ),
        "current_total_supply"  AS (
          SELECT db.average as current_total_supply_amount from "dao_metrics_day_buckets" db 
          WHERE db.dao_id=${daoId} 
          AND db."metricType"=${MetricTypesEnum.TOTAL_SUPPLY}
          ORDER BY db."date" DESC LIMIT 1
        )
        SELECT COALESCE("old_total_supply"."old_total_supply_amount", 0) AS "oldTotalSupply", 
        COALESCE("current_total_supply"."current_total_supply_amount", 0) AS "currentTotalSupply"
        FROM "current_total_supply"
        LEFT JOIN "old_total_supply" ON 1=1;
        `;

        const result = (await db.execute(query)).rows[0] as Record<
          string,
          string
        >;

        const oldVal = result[`old${resultKey}`] || "0";
        const currentVal = result[`current${resultKey}`] || "0";

        const changeRate =
          oldVal === "0"
            ? "0"
            : formatUnits(
              (BigInt(currentVal) * BigInt(1e18)) / BigInt(oldVal) -
              BigInt(1e18),
              18,
            );

        return ctx.json(
          {
            [`old${resultKey}`]: oldVal,
            [`current${resultKey}`]: currentVal,
            changeRate,
          } as unknown as z.infer<typeof resultSchema>,
          200,
        );
      },
    );
  }
}
