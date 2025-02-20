import { DaoIdEnum } from "@/lib/enums";
import { ponder } from "ponder:registry";
import { getConfig } from "../config/config";
import { DuneService } from "../services/dune/dune.service";
import { AssetsService } from "../services/assets/assets.service";
import { RedisService } from "../services/cache/redis.service";
import { DaysEnum } from "@/lib/daysEnum";

const config = getConfig();

const duneClient = new DuneService(config.duneApiUrl, config.duneApiKey);
const cacheService = config.redisUrl
  ? new RedisService(config.redisUrl)
  : undefined;

ponder.get("/dao/:daoId/assets", async (context) => {
  const daoId = context.req.param("daoId") as DaoIdEnum;
  if (![DaoIdEnum.ENS].includes(daoId)) {
    return context.json({ error: "Not supported for this DAO" }, 404);
  }
  let days = context.req.query("days") as `${number}d` | undefined;
  // if days is not one of the DaysEnum keys, set it to undefined
  if(days !== undefined && ![...Object.keys(DaysEnum)].includes(days)){
    days = undefined;
  }
  const sizeNumber =
    days !== undefined ? parseInt(days.split("d")[0] as `${number}`) : 90;
  const assetsService = new AssetsService(daoId, duneClient, cacheService);
  const data = await assetsService.getTotalAssets(sizeNumber);

  return context.json(data);
});
