import { gt, desc, sql, and } from "ponder";
import { db } from "ponder:api";
import { transfer } from "ponder:schema";

export class NftRepository {
  async getHistoricalTokenData(
    days: number,
    window: number,
  ): Promise<
    {
      timestamp: number;
      price: number;
    }[]
  > {
    const subquery = db
      .select({
        amount: transfer.amount,
        timestamp: transfer.timestamp,
      })
      .from(transfer)
      .where(and(gt(transfer.amount, 0n)))
      .orderBy(desc(transfer.timestamp))
      .limit(days)
      .as("recent_transfers");

    return await db
      .select({
        timestamp: sql<number>`CAST(${subquery.timestamp} AS INTEGER)`.as(
          "timestamp",
        ),
        price: sql<number>`AVG(CAST(${subquery.amount} AS DECIMAL)) OVER (
          ORDER BY ${subquery.timestamp} ASC 
          ROWS BETWEEN ${window - 1} PRECEDING AND CURRENT ROW
        )`.as("moving_avg"),
      })
      .from(subquery)
      .orderBy(desc(subquery.timestamp));
  }
}
