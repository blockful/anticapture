import { z } from "@hono/zod-openapi";

export enum ChartType {
  CostComparison = "cost_comparison",
  AttackProfitability = "attack_profitability",
  TokenDistribution = "token_distribution",
}

export const LastUpdateQuerySchema = z
  .object({
    chart: z.enum(ChartType).openapi({
      description:
        "Chart identifier whose freshness timestamp should be returned.",
      example: ChartType.TokenDistribution,
    }),
  })
  .openapi("LastUpdateQuery", {
    description: "Query params for the last-update endpoint.",
  });

export const LastUpdateResponseSchema = z
  .object({
    lastUpdate: z.string().openapi({
      description: "Latest refresh time in ISO-8601 format.",
      example: "2026-03-24T12:00:00.000Z",
    }),
  })
  .openapi("LastUpdateResponse", {
    description:
      "Response payload describing the latest update time for a chart.",
  });
