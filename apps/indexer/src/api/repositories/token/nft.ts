import { db } from "ponder:api";
import { tokenPrice } from "ponder:schema";
import { sql, and, gte } from "ponder";

import { TokenHistoricalPriceResponse } from "@/api/mappers";

export class NFTPriceRepository {
  async getHistoricalNFTPrice(
    days: number,
  ): Promise<TokenHistoricalPriceResponse> {
    const timestamp = Math.floor(Date.now() / 1000 - days * 24 * 60 * 60);

    return await db
      .select({
        price: sql<string>`CAST(AVG(${tokenPrice.price}) AS CHAR)`,
        timestamp: sql<string>`CAST(DATE(FROM_UNIXTIME(${tokenPrice.timestamp} / 1000)) AS CHAR)`,
      })
      .from(tokenPrice)
      .where(and(gte(tokenPrice.timestamp, BigInt(timestamp))))
      .groupBy(sql`DATE(FROM_UNIXTIME(${tokenPrice.timestamp} / 1000))`)
      .orderBy(sql`DATE(FROM_UNIXTIME(${tokenPrice.timestamp} / 1000))`);
  }
}
