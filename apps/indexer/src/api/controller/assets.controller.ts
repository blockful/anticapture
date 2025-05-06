import { Hono } from "hono";
import { zValidator as validator } from "@hono/zod-validator";
import { z } from "zod";

import { DaoIdEnum } from "@/lib/enums";
import { DuneService } from "@/api/services/dune/dune.service";
import { AssetsService } from "@/api/services/assets/assets.service";
import { redisService } from "@/api/services/cache/redis.service";
import { DaysEnum } from "@/lib/daysEnum";
import { caseInsensitiveEnum } from "../middlewares";
import { env } from "@/env";

const app = new Hono();

const duneClient = new DuneService(env.DUNE_API_URL, env.DUNE_API_KEY);

app.get(
  "/dao/:daoId/total-assets",
  validator("param", z.object({ daoId: caseInsensitiveEnum(DaoIdEnum) })),
  validator(
    "query",
    z.object({ days: caseInsensitiveEnum(DaysEnum).default(DaysEnum["90d"]) }),
  ),
  async (context) => {
    const { daoId } = context.req.valid("param");
    const { days } = context.req.valid("query");

    const assetsService = new AssetsService(daoId, duneClient, redisService);
    const data = await assetsService.getTotalAssets(days);

    return context.json(data);
  },
);

export default app;
