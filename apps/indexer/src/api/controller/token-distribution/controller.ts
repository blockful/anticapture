import { OpenAPIHono as Hono, createRoute, z } from "@hono/zod-openapi";
import { formatUnits, parseEther } from "viem";

import { DaysEnum, DaysOpts } from "@/lib/daysEnum";
import { MetricTypesEnum } from "@/lib/constants";
import { DaoIdEnum } from "@/lib/enums";
import { caseInsensitiveEnum } from "@/api/middlewares";

interface TokenDistributionRepository {
  getSupplyComparison(
    metricType: string,
    days: DaysEnum,
  ): Promise<{ oldValue: string; currentValue: string } | undefined>;
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
        oldTotalSupply: z.string().nullable(),
        currentTotalSupply: z.string().nullable(),
        changeRate: z.number().nullable(),
      }),
    },
    {
      path: "delegated-supply",
      metric: MetricTypesEnum.DELEGATED_SUPPLY,
      resultKey: "DelegatedSupply",
      resultSchema: z.object({
        oldDelegatedSupply: z.string().nullable(),
        currentDelegatedSupply: z.string().nullable(),
        changeRate: z.number().nullable(),
      }),
    },
    {
      path: "circulating-supply",
      metric: MetricTypesEnum.CIRCULATING_SUPPLY,
      resultKey: "CirculatingSupply",
      resultSchema: z.object({
        oldCirculatingSupply: z.string().nullable(),
        currentCirculatingSupply: z.string().nullable(),
        changeRate: z.number().nullable(),
      }),
    },
    {
      path: "treasury",
      metric: MetricTypesEnum.TREASURY,
      resultKey: "Treasury",
      resultSchema: z.object({
        oldTreasury: z.string().nullable(),
        currentTreasury: z.string().nullable(),
        changeRate: z.number().nullable(),
      }),
    },
    {
      path: "cex-supply",
      metric: MetricTypesEnum.CEX_SUPPLY,
      resultKey: "CexSupply",
      resultSchema: z.object({
        oldCexSupply: z.string().nullable(),
        currentCexSupply: z.string().nullable(),
        changeRate: z.number().nullable(),
      }),
    },
    {
      path: "dex-supply",
      metric: MetricTypesEnum.DEX_SUPPLY,
      resultKey: "DexSupply",
      resultSchema: z.object({
        oldDexSupply: z.string().nullable(),
        currentDexSupply: z.string().nullable(),
        changeRate: z.number().nullable(),
      }),
    },
    {
      path: "lending-supply",
      metric: MetricTypesEnum.LENDING_SUPPLY,
      resultKey: "LendingSupply",
      resultSchema: z.object({
        oldLendingSupply: z.string().nullable(),
        currentLendingSupply: z.string().nullable(),
        changeRate: z.number().nullable(),
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
        const { days } = ctx.req.valid("query");

        const result = await repository.getSupplyComparison(metric, days);

        if (!result || (!result.oldValue && !result.currentValue)) {
          return ctx.json(
            {
              [`old${resultKey}`]: null,
              [`current${resultKey}`]: null,
              changeRate: null,
            } as z.infer<typeof resultSchema>,
            200,
          );
        }

        const { oldValue, currentValue } = result;

        /* eslint-disable */
        const changeRate =
          oldValue !== "0" &&
          (BigInt(currentValue) * parseEther("1")) / BigInt(oldValue) -
          parseEther("1");
        /* eslint-enable */

        return ctx.json(
          {
            [`old${resultKey}`]: oldValue || "0",
            [`current${resultKey}`]: currentValue || "0",
            changeRate: changeRate
              ? Number(formatUnits(changeRate, 18)).toFixed(2)
              : 0,
          } as z.infer<typeof resultSchema>,
          200,
        );
      },
    );
  }
}
