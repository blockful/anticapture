import { asc, desc, gte, sql, and, inArray, eq, lte, lt } from "ponder";
import { db } from "ponder:api";
import { accountBalance, balanceHistory } from "ponder:schema";
import { DBAccountBalanceVariation } from "@/api/mappers";
import { Address } from "viem";

export class BalanceVariationsRepository {
  async getAccountBalanceVariations(
    fromTimestamp: number,
    toTimestamp: number,
    limit: number,
    skip: number,
    orderDirection: "asc" | "desc",
    addresses?: Address[],
  ): Promise<DBAccountBalanceVariation[]> {
    const orderDirectionFn = orderDirection === "asc" ? asc : desc;

    const latestBeforeFrom = db
      .select({
        accountId: balanceHistory.accountId,
        balance: balanceHistory.balance,
        rn: sql<number>`ROW_NUMBER() OVER (
        PARTITION BY ${balanceHistory.accountId} 
        ORDER BY ${balanceHistory.timestamp} DESC, ${balanceHistory.logIndex} DESC
      )`.as("rn"),
      })
      .from(balanceHistory)
      .where(
        and(
          addresses ? inArray(balanceHistory.accountId, addresses) : undefined,
          lt(balanceHistory.timestamp, BigInt(fromTimestamp)),
        ),
      )
      .as("latest_before_from");

    const latestBeforeTo = db
      .select({
        accountId: balanceHistory.accountId,
        balance: balanceHistory.balance,
        rn: sql<number>`ROW_NUMBER() OVER (
        PARTITION BY ${balanceHistory.accountId} 
        ORDER BY ${balanceHistory.timestamp} DESC, ${balanceHistory.logIndex} DESC
      )`.as("rn"),
      })
      .from(balanceHistory)
      .where(
        and(
          addresses ? inArray(balanceHistory.accountId, addresses) : undefined,
          lte(balanceHistory.timestamp, BigInt(toTimestamp)),
        ),
      )
      .as("latest_before_to");

    return await db
      .select({
        accountId: sql<Address>`COALESCE(from_data.account_id, to_data.account_id)`,
        previousBalance: sql<bigint>`COALESCE(from_data.balance, 0)`,
        currentBalance: sql<bigint>`COALESCE(to_data.balance, 0)`,
        absoluteChange: sql<bigint>`(COALESCE(to_data.balance, 0) - COALESCE(from_data.balance, 0))`,
        percentageChange: sql<string>`
        CASE 
          WHEN COALESCE(from_data.balance, 0) = 0 THEN 
            CASE WHEN COALESCE(to_data.balance, 0) = 0 THEN '0' ELSE 'Infinity' END
          ELSE 
            (((COALESCE(to_data.balance, 0) - from_data.balance)::numeric / from_data.balance::numeric) * 100)::text
        END
      `,
      })
      .from(sql`(SELECT * FROM ${latestBeforeFrom} WHERE rn = 1) as from_data`)
      .fullJoin(
        sql`(SELECT * FROM ${latestBeforeTo} WHERE rn = 1) as to_data`,
        sql`from_data.account_id = to_data.account_id`,
      )
      .orderBy(
        orderDirectionFn(
          sql<bigint>`ABS(COALESCE(to_data.balance, 0) - COALESCE(from_data.balance, 0))`,
        ),
      )
      .limit(limit)
      .offset(skip);
  }

  async getAccountBalanceVariationsByAccountId(
    address: Address,
    fromTimestamp: number,
    toTimestamp: number,
  ): Promise<DBAccountBalanceVariation> {
    const history = db
      .select({
        accountId: balanceHistory.accountId,
        delta: balanceHistory.delta,
      })
      .from(balanceHistory)
      .orderBy(desc(balanceHistory.timestamp))
      .where(
        and(
          eq(balanceHistory.accountId, address),
          gte(balanceHistory.timestamp, BigInt(fromTimestamp)),
          lte(balanceHistory.timestamp, BigInt(toTimestamp)),
        ),
      )
      .as("history");

    const [delta] = await db
      .select({
        accountId: history.accountId,
        absoluteChange: sql<bigint>`SUM(${history.delta})`.as("agg_delta"),
      })
      .from(history)
      .groupBy(history.accountId);

    const [currentBalance] = await db
      .select({ value: accountBalance.balance })
      .from(accountBalance)
      .where(eq(accountBalance.accountId, address));

    if (!currentBalance) throw new Error("Account not found");

    const numericAbsoluteChange = BigInt(delta?.absoluteChange || "0");
    const currentBalanceValue = currentBalance.value;
    const oldBalance = currentBalance.value - numericAbsoluteChange;
    const percentageChange = oldBalance
      ? (Number((numericAbsoluteChange * 10000n) / oldBalance) / 100).toFixed(2)
      : "0";

    return {
      accountId: address,
      previousBalance: currentBalanceValue - numericAbsoluteChange,
      currentBalance: currentBalanceValue,
      absoluteChange: numericAbsoluteChange,
      percentageChange: percentageChange,
    };
  }
}
