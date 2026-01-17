import { asc, desc, eq, gte, lte, SQL, inArray, and, sql } from "drizzle-orm";
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
    fromValue: bigint | undefined,
    toValue: bigint | undefined,
    delegateAddressIn: Address[] | undefined,
  ): Promise<{
    items: DBDelegation[];
    totalCount: number;
  }> {
    const baseQuery = db
      .select()
      .from(delegation)
      .where(this.filterToSql(address, fromValue, toValue, delegateAddressIn))
      .orderBy(
        orderDirection === "asc"
          ? asc(delegation.timestamp)
          : desc(delegation.timestamp),
      );

    const [totalCount] = await db
      .select({
        count: sql<number>`COUNT(*)`.as("count"),
      })
      .from(baseQuery.as("subquery"));

    const items = await baseQuery.offset(skip).limit(limit);

    return {
      items: items,
      totalCount: totalCount?.count ?? 0,
    };
  }

  filterToSql = (
    address: Address,
    fromValue: bigint | undefined,
    toValue: bigint | undefined,
    delegateAddressIn: Address[] | undefined,
  ): SQL | undefined => {
    const conditions = [eq(delegation.delegatorAccountId, address)];

    if (fromValue) {
      conditions.push(gte(delegation.timestamp, fromValue));
    }

    if (toValue) {
      conditions.push(lte(delegation.timestamp, toValue));
    }

    if (delegateAddressIn) {
      conditions.push(
        inArray(
          delegation.delegateAccountId,
          delegateAddressIn.map((address) => address),
        ),
      );
    }

    return and(...conditions);
  };
}

export class DelegationsRepository {
  async getDelegations(address: Address): Promise<DBDelegation[]> {
    // Get only the latest delegation
    const latestDelegation = await db
      .select()
      .from(delegation)
      .where(eq(delegation.delegatorAccountId, address))
      .orderBy(desc(delegation.timestamp), desc(delegation.logIndex))
      .limit(1);

    return latestDelegation;
  }
}
