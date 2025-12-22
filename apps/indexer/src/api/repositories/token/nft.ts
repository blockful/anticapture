import { tokenPrice } from "ponder:schema";
import { desc, sql } from "drizzle-orm";

import { TokenHistoricalPriceResponse } from "@/api/mappers";
import { DrizzleDB } from "@/api/database";

export class NFTPriceRepository {
  constructor(private readonly db: DrizzleDB) {}
  /**
   * Repository for handling NFT price data and calculations.
   * Provides methods to retrieve historical NFT auction prices with rolling averages.
   */
  async getHistoricalNFTPrice(
    limit: number,
    offset: number,
  ): Promise<TokenHistoricalPriceResponse> {
    return await this.db
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
    return (await this.db.query.tokenPrice.findFirst({
      orderBy: desc(tokenPrice.timestamp),
    }))!.price.toString();
  }
}
