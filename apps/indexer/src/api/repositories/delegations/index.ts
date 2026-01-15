import { asc, desc, eq, count } from "drizzle-orm";
import { db } from "ponder:api";
import { delegation } from "ponder:schema";
import { Address } from "viem";

type DBDelegation = typeof delegation.$inferSelect;

export class HistoricalDelegationsRepository {
  async getHistoricalDelegations(
    address: Address,
    orderDirection: "asc" | "desc",
    skip: number,
    limit: number,
  ): Promise<DBDelegation[]> {
    return await db
      .select()
      .from(delegation)
      .where(eq(delegation.delegateAccountId, address))
      .orderBy(
        orderDirection === "asc"
          ? asc(delegation.timestamp)
          : desc(delegation.timestamp),
      )
      .offset(skip)
      .limit(limit);
  }

  async getHistoricalDelegationsCount(address: Address): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(delegation)
      .where(eq(delegation.delegateAccountId, address));

    return result[0]?.count || 0;
  }
}
