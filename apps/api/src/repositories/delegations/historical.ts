import { DBDelegation } from "@/mappers";
import { asc, desc, eq, gte, lte, SQL, inArray, and, sql } from "drizzle-orm";
import { Drizzle } from "@/database";
import { delegation } from "@/database";
import { Address } from "viem";

export class HistoricalDelegationsRepository {
  constructor(private readonly db: Drizzle) {}

  async getHistoricalDelegations(
    // TODO: add support to partial delegations at some point
    address: Address,
    orderDirection: "asc" | "desc",
    skip: number,
    limit: number,
    fromValue?: bigint,
    toValue?: bigint,
    delegateAddressIn?: Address[],
  ): Promise<{
    items: DBDelegation[];
    totalCount: number;
  }> {
    const baseQuery = this.db
      .select()
      .from(delegation)
      .where(this.filterToSql(address, fromValue, toValue, delegateAddressIn))
      .orderBy(
        orderDirection === "asc"
          ? asc(delegation.timestamp)
          : desc(delegation.timestamp),
      );

    const [totalCount] = await this.db
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
