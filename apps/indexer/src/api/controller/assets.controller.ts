import { Hono } from "hono";
import { zValidator as validator } from "@hono/zod-validator";
import { z } from "zod";

import { DaoIdEnum } from "@/lib/enums";
import { DaysEnum } from "@/lib/daysEnum";
import { caseInsensitiveEnum } from "../middlewares";
import { DuneResponse } from "../services/dune/types";

interface AssetsClient {
  fetchTotalAssets(size: number): Promise<DuneResponse>;
}

export function assets(app: Hono, service: AssetsClient) {
  app.get(
    "/dao/:daoId/total-assets",
    validator("param", z.object({ daoId: caseInsensitiveEnum(DaoIdEnum) })),
    validator(
      "query",
      z.object({
        days: caseInsensitiveEnum(DaysEnum).default(DaysEnum["90d"]),
      }),
    ),
    async (context) => {
      const { days } = context.req.valid("query");
      const data = await service.fetchTotalAssets(days);
      return context.json(data.result.rows);
    },
  );
}
