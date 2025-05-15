import { Hono } from "hono";
import { z } from "zod";
import { zValidator as validator } from "@hono/zod-validator";

import { DaoIdEnum } from "@/lib/enums";
import {
  CoingeckoTokenId,
  CoingeckoTokenIdEnum,
  CoingeckoHistoricalMarketData,
} from "../services/coingecko/types";
import { DAYS_IN_YEAR } from "@/lib/constants";

interface TokenHistoricalDataClient {
  getHistoricalTokenData(
    tokenId: CoingeckoTokenId,
    days: number,
  ): Promise<CoingeckoHistoricalMarketData>;
}

export function tokenHistoricalData(
  app: Hono,
  client: TokenHistoricalDataClient,
) {
  app.get(
    "/token/:daoId/historical-data",
    validator(
      "param",
      z.object({
        daoId: z.nativeEnum(DaoIdEnum),
      }),
    ),
    async (context) => {
      const { daoId } = context.req.valid("param");

      const data = await client.getHistoricalTokenData(
        CoingeckoTokenIdEnum[daoId],
        DAYS_IN_YEAR,
      );

      if (!data || Object.keys(data).length === 0) {
        return context.json(
          {
            message: "No historical data found for this token",
          },
          404,
        );
      }

      return context.json({ historicalData: data });
    },
  );
}
