import { AmountFilter, DBAccountBalance } from "@/api/mappers";
import { and, asc, desc, eq, gte, inArray, not, SQL, sql } from "drizzle-orm";
import { db } from "ponder:api";
import { accountBalance } from "ponder:schema";
import { Address } from "viem";

export class AccountBalanceRepository {
  async getAccountBalances(
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
    addresses: Address[],
    delegates: Address[],
    excludeAddresses: Address[],
    amountfilter: AmountFilter,
  ): Promise<{
    items: DBAccountBalance[];
    totalCount: bigint;
  }> {
    const filter = this.filterToSql(
      addresses,
      delegates,
      excludeAddresses,
      amountfilter,
    );

    const baseQuery = db.select().from(accountBalance).where(filter);

    const totalCount = await db
      .select({
        count: sql<number>`COUNT(*)`.as("count"),
      })
      .from(baseQuery.as("subquery"));

    const page = await baseQuery
      .orderBy(
        orderDirection === "desc"
          ? desc(accountBalance.balance)
          : asc(accountBalance.balance),
      )
      .offset(skip)
      .limit(limit);

    return {
      items: page,
      totalCount: BigInt(totalCount[0]?.count ?? 0),
    };
  }

  async getAccountBalance(
    accountId: Address,
  ): Promise<DBAccountBalance | undefined> {
    const [result] = await db
      .select()
      .from(accountBalance)
      .where(eq(accountBalance.accountId, accountId))
      .limit(1);

    return result;
  }

  private filterToSql(
    addresses: Address[],
    delegates: Address[],
    excludeAddresses: Address[],
    amountfilter: AmountFilter,
  ): SQL | undefined {
    const conditions = [];

    if (addresses.length) {
      conditions.push(inArray(accountBalance.accountId, addresses));
    }
    if (delegates.length) {
      conditions.push(inArray(accountBalance.delegate, delegates));
    }
    if (amountfilter.minAmount) {
      gte(accountBalance.balance, BigInt(amountfilter.minAmount));
    }
    if (amountfilter.maxAmount) {
      gte(accountBalance.balance, BigInt(amountfilter.maxAmount));
    }
    if (excludeAddresses.length) {
      conditions.push(not(inArray(accountBalance.accountId, excludeAddresses)));
    }

    return and(...conditions);
  }
}
