import { DaoIdEnum } from "@/lib/enums";
import { getApiConfig } from "@/api/config/config";
import { DuneService } from "@/api/services/dune/dune.service";
import { AssetsService } from "@/api/services/assets/assets.service";
import { redisService } from "@/api/services/cache/redis.service";
import { DaysEnum } from "@/lib/daysEnum";
import { Hono } from "hono";

const app = new Hono();

const config = getApiConfig();

const duneClient = new DuneService(config.duneApiUrl, config.duneApiKey);

app.get("/dao/:daoId/assets", async (context) => {
  const daoId = context.req.param("daoId") as DaoIdEnum;
  if (![DaoIdEnum.ENS].includes(daoId)) {
    return context.json({ error: "Not supported for this DAO" }, 404);
  }
  let days = context.req.query("days") as `${number}d` | undefined;
  // if days is not one of the DaysEnum keys, set it to undefined
  if (days !== undefined && ![...Object.keys(DaysEnum)].includes(days)) {
    days = undefined;
  }
  const sizeNumber =
    days !== undefined ? parseInt(days.split("d")[0] as `${number}`) : 90;
  const assetsService = new AssetsService(daoId, duneClient, redisService);
  const data = await assetsService.getTotalAssets(sizeNumber);

  return context.json(data);
});

export default app;
