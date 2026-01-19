import { DBDelegation } from "@/api/mappers";
import { asc, desc, eq, gte, lte, SQL, inArray, and, sql } from "drizzle-orm";
import { db } from "ponder:api";
import { delegation } from "ponder:schema";
import { Address } from "viem";

export class HistoricalDelegationsRepository {
  async getHistoricalDelegations(
    // TODO: add support to partial delegations at some point
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
