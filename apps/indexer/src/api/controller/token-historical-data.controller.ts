import { DaoIdEnum } from "@/lib/enums";
import { TokenHistoricalDataService } from "../services/token-historical-data/token-historical-data.service";
import { Hono } from "hono";
import { coingeckoService } from "../services/coingecko/coingecko.service";
import { redisService } from "../services/cache/redis.service";

const app = new Hono();

app.get("/token/:daoId/historical-data", async (context) => {
  const daoId = context.req.param("daoId") as DaoIdEnum;
  const tokenHistoricalDataService = new TokenHistoricalDataService(
    coingeckoService,
    redisService,
  );
  const data = await tokenHistoricalDataService.getHistoricalTokenPrice(daoId);
  return context.json(data);
});

export default app;
