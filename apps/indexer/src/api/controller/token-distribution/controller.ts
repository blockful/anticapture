import { OpenAPIHono as Hono, createRoute, z } from "@hono/zod-openapi";
import { formatUnits } from "viem";

import { DaysEnum, DaysOpts } from "@/lib/daysEnum";
import { MetricTypesEnum } from "@/lib/constants";
import { DaoIdEnum } from "@/lib/enums";
import { caseInsensitiveEnum } from "@/api/middlewares";

interface TokenDistributionRepository {
  getSupplyComparison(
    daoId: string,
    metricType: string,
    oldTimestamp: bigint,
  ): Promise<{ oldValue: string; currentValue: string }>;
}

export function tokenDistribution(
  app: Hono,
  repository: TokenDistributionRepository,
) {
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
        operationId: `compare${resultKey}`,
        path: `/dao/{daoId}/${path}/compare`,
        summary: `Compare ${path.replace(/-/g, " ")} between periods`,
        tags: ["tokens"],
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

        const { oldValue, currentValue } = await repository.getSupplyComparison(
          daoId,
          metric,
          oldTimestamp,
        );

        /* eslint-disable */
        const changeRate = !oldValue
          ? "0"
          : formatUnits(
            (BigInt(currentValue) * BigInt(1e18)) / BigInt(oldValue) -
            BigInt(1e18),
            18,
          );
        /* eslint-enable */

        return ctx.json(
          {
            [`old${resultKey}`]: oldValue || "0",
            [`current${resultKey}`]: currentValue || "0",
            changeRate,
          } as z.infer<typeof resultSchema>,
          200,
        );
      },
    );
  }
}
