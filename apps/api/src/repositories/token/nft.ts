import { desc, sql } from "drizzle-orm";

import { Drizzle, tokenPrice } from "@/database";
import { TokenHistoricalPriceResponse } from "@/mappers";

export class NFTPriceRepository {
  constructor(private readonly db: Drizzle) {}

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
        // FLOOR keeps the value an integer wei string: AVG over NUMERIC emits
        // decimal text (e.g. "200.5000000000000000"), which BigInt() rejects.
        price: sql<string>`
      CAST(
        FLOOR(
          AVG(CAST(${tokenPrice.price} AS NUMERIC)) OVER (
            ORDER BY ${tokenPrice.timestamp}
            RANGE BETWEEN 2505600 PRECEDING AND CURRENT ROW
          )
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
