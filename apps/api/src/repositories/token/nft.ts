import { db } from "ponder:api";
import { tokenPrice } from "@/db/schema";
import { desc, sql } from "drizzle-orm";

import { TokenHistoricalPriceResponse } from "@/mappers";

export class NFTPriceRepository {
  /**
   * Repository for handling NFT price data and calculations.
   * Provides methods to retrieve historical NFT auction prices with rolling averages.
   */
  async getHistoricalNFTPrice(
    limit: number,
    offset: number,
  ): Promise<TokenHistoricalPriceResponse> {
    return await db
      .select({
        price: sql<string>`
      CAST(
        AVG(CAST(${tokenPrice.price} AS NUMERIC)) OVER (
          ORDER BY ${tokenPrice.timestamp}
          RANGE BETWEEN 2505600 PRECEDING AND CURRENT ROW
        ) AS TEXT
      )
    `,
        timestamp: sql<number>`CAST(${tokenPrice.timestamp} AS TEXT)`,
      })
      .from(tokenPrice)
      .orderBy(desc(tokenPrice.timestamp))
      .limit(limit)
      .offset(offset);
  }

  async getTokenPrice(): Promise<string> {
    return (await db.query.tokenPrice.findFirst({
      orderBy: desc(tokenPrice.timestamp),
    }))!.price.toString();
  }
}
