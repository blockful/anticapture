import { DaoIdEnum } from "@/lib/enums";
import { ponder } from "ponder:registry";
import { getConfig } from "../config/config";
import { DuneService } from "../services/dune/dune.service";
import { AssetsService } from "../services/assets/assets.service";
import { RedisService } from "../services/cache/cache.service";

const config = getConfig();

const duneClient = new DuneService(config.duneApiUrl, config.duneApiKey);
const cacheService = config.redisUrl ? new RedisService(config.redisUrl) : undefined;

ponder.get("/dao/:daoId/assets", async (context) => {
  const daoId = context.req.param("daoId") as DaoIdEnum;
  if (![DaoIdEnum.ENS].includes(daoId)) {
    return context.json({ error: "Not supported for this DAO" }, 404);
  }
    const size = context.req.query("size");
  const assetsService = new AssetsService(daoId, duneClient, cacheService);
  const data = await assetsService.getTotalAssets(parseInt(size || "90"));

  return context.json(data);
});
