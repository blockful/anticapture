import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";
import { formatUnits, parseEther } from "viem";

import { MetricTypesEnum } from "@/lib/constants";
import { DaysEnum, SECONDS_IN_DAY } from "@/lib/enums";
import { setCacheControl } from "@/middlewares";
import {
  SupplyComparisonResponseSchema,
  TokenDistributionComparisonQuerySchema,
} from "@/mappers";

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
    { path: "total-supply", metric: MetricTypesEnum.TOTAL_SUPPLY },
    { path: "delegated-supply", metric: MetricTypesEnum.DELEGATED_SUPPLY },
    { path: "circulating-supply", metric: MetricTypesEnum.CIRCULATING_SUPPLY },
    { path: "treasury", metric: MetricTypesEnum.TREASURY },
    { path: "cex-supply", metric: MetricTypesEnum.CEX_SUPPLY },
    { path: "dex-supply", metric: MetricTypesEnum.DEX_SUPPLY },
    { path: "lending-supply", metric: MetricTypesEnum.LENDING_SUPPLY },
  ];

  for (const { path, metric } of routes) {
    const operationId = `compare${path
      .split("-")
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join("")}`;

    app.openapi(
      createRoute({
        method: "get",
        operationId,
        path: `/${path}/compare`,
        summary: `Compare ${path.replace(/-/g, " ")} between periods`,
        tags: ["tokens"],
        middleware: [setCacheControl(60)],
        request: {
          query: TokenDistributionComparisonQuerySchema,
        },
        responses: {
          200: {
            description: `${path.replace(/-/g, " ")} comparison`,
            content: {
              "application/json": { schema: SupplyComparisonResponseSchema },
            },
          },
        },
      }),
      async (ctx) => {
        const { days = 90 * SECONDS_IN_DAY } = ctx.req.valid("query");

        const result = await repository.getSupplyComparison(metric, days);

        if (!result) {
          return ctx.json(
            { previousValue: "0", currentValue: "0", changeRate: 0 },
            200,
          );
        }

        const { oldValue, currentValue } = result;

        const changeRate =
          parseInt(oldValue) &&
          (BigInt(currentValue) * parseEther("1")) / BigInt(oldValue) -
            parseEther("1");

        return ctx.json(
          {
            previousValue: oldValue || "0",
            currentValue: currentValue || "0",
            changeRate: changeRate
              ? Number(Number(formatUnits(changeRate, 18)).toFixed(2))
              : 0,
          },
          200,
        );
      },
    );
  }
}
