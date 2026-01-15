import { asc, desc, eq, sql, gte, lte, SQL, inArray, and } from "drizzle-orm";
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
    delegateAddressIn: Address[],
    orderBy: "timestamp",
  ): Promise<{
    items: DBDelegation[];
    totalCount: number;
  }> {
    const baseQuery = await db
      .select()
      .from(delegation)
      .where(
        this.filterToSql({ address, fromValue, toValue, delegateAddressIn }),
      )
      .orderBy(
        orderDirection === "asc"
          ? asc(delegation.timestamp)
          : desc(delegation.timestamp),
      )
      .limit(limit)
      .offset(skip);

    // const totalCount = await db
    //   .select({
    //     count: sql<number>`COUNT(*)`.as("count"),
    //   })
    //   .from(baseQuery.as("subquery"));

    // const items = await baseQuery.offset(skip).limit(limit);

    return {
      items: baseQuery,
      totalCount: 0,
    };
  }

  filterToSql = (filter: {
    address: Address;
    fromValue: bigint | undefined;
    toValue: bigint | undefined;
    delegateAddressIn: Address[];
  }): SQL | undefined => {
    const conditions = [
      eq(delegation.delegatorAccountId, filter.address.toLowerCase()),
    ];

    if (filter.fromValue) {
      conditions.push(gte(delegation.timestamp, filter.fromValue));
    }

    if (filter.toValue) {
      conditions.push(lte(delegation.timestamp, filter.toValue));
    }

    if (filter.delegateAddressIn) {
      conditions.push(
        inArray(
          delegation.delegateAccountId,
          filter.delegateAddressIn.map((address) => address.toLowerCase()),
        ),
      );
    }

    return and(...conditions);
  };
}
