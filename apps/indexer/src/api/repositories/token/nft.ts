import { db } from "ponder:api";
import { tokenPrice } from "ponder:schema";
import { desc, sql } from "ponder";

import { TokenHistoricalPriceResponse } from "@/api/mappers";

export class NFTPriceRepository {
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
