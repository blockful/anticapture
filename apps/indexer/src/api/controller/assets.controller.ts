import { OpenAPIHono as Hono } from "@hono/zod-openapi";
import { createRoute } from "@hono/zod-openapi";
import { z } from "zod";

import { DaoIdEnum } from "@/lib/enums";
import { DaysOpts } from "@/lib/daysEnum";
import { caseInsensitiveEnum } from "../middlewares";
import { DuneResponse } from "../services/dune/types";

interface AssetsClient {
  fetchTotalAssets(size: number): Promise<DuneResponse>;
}

export function assets(app: Hono, service: AssetsClient) {
  app.openapi(
    createRoute({
      method: "get",
      path: "/dao/{daoId}/total-assets",
      summary: "Get total assets",
      description: "Get total assets",
      tags: ["assets"],
      request: {
        params: z.object({
          daoId: caseInsensitiveEnum(DaoIdEnum),
        }),
        query: z.object({
          days: z
            .enum(DaysOpts)
            .default("7d")
            .transform((val) => parseInt(val.replace("d", ""))),
        }),
      },
      responses: {
        200: {
          description: "Returns the total assets by day",
          content: {
            "application/json": {
              schema: z.array(
                z.object({
                  totalAssets: z.string(),
                  date: z.string(),
                }),
              ),
            },
          },
        },
      },
    }),
    async (context) => {
      const { days } = context.req.valid("query");
      const data = await service.fetchTotalAssets(days);
      return context.json(data.result.rows);
    },
  );
}
