import { asc, desc, gte, sql, and, inArray, lte } from "drizzle-orm";
import { Drizzle } from "@/database";
import { accountBalance, transfer } from "@/database";
import { DBAccountBalanceVariation } from "@/mappers";
import { Address } from "viem";

export class BalanceVariationsRepository {
  constructor(private readonly db: Drizzle) { }

  async getAccountBalanceVariations(
    fromTimestamp: number | undefined,
    toTimestamp: number | undefined,
    limit: number,
    skip: number,
    orderDirection: "asc" | "desc",
    addresses?: Address[],
  ): Promise<DBAccountBalanceVariation[]> {
    return this.commonQuery(
      fromTimestamp,
      toTimestamp,
      limit,
      skip,
      orderDirection,
      addresses,
    );
  }

  async getAccountBalanceVariationsByAccountId(
    address: Address,
    fromTimestamp: number | undefined,
    toTimestamp: number | undefined,
  ): Promise<DBAccountBalanceVariation | undefined> {
    const [result] = await this.commonQuery(
      fromTimestamp,
      toTimestamp,
      1,
      0,
      "desc",
      [address],
    );

    return result;
  }

  private async commonQuery(
    fromTimestamp: number | undefined,
    toTimestamp: number | undefined,
    limit: number,
    skip: number,
    orderDirection: "asc" | "desc",
    addresses?: Address[],
  ): Promise<DBAccountBalanceVariation[]> {
    const scopedTransfers = this.db
      .select()
      .from(transfer)
      .where(
        and(
          fromTimestamp
            ? gte(transfer.timestamp, BigInt(fromTimestamp))
            : undefined,
          toTimestamp
            ? lte(transfer.timestamp, BigInt(toTimestamp))
            : undefined,
        ),
      )
      .as("scoped_transfers");

    const transfersFrom = this.db
      .select({
        accountId: scopedTransfers.fromAccountId,
        fromAmount: sql<string>`-SUM(${scopedTransfers.amount})`.as("from_amount"),
      })
      .from(scopedTransfers)
      .groupBy(scopedTransfers.fromAccountId)
      .as("transfers_from");

    const transfersTo = this.db
      .select({
        accountId: scopedTransfers.toAccountId,
        toAmount: sql<string>`SUM(${scopedTransfers.amount})`.as("to_amount"),
      })
      .from(scopedTransfers)
      .groupBy(scopedTransfers.toAccountId)
      .as("transfers_to");

    const combined = this.db
      .select({
        accountId: accountBalance.accountId,
        currentBalance: accountBalance.balance,
        fromChange: sql<string>`COALESCE(${transfersFrom.fromAmount}, 0)`.as(
          "from_change",
        ),
        toChange: sql<string>`COALESCE(${transfersTo.toAmount}, 0)`.as(
          "to_change",
        ),
      })
      .from(accountBalance)
      .leftJoin(
        transfersFrom,
        sql`${accountBalance.accountId} = ${transfersFrom.accountId}`,
      )
      .leftJoin(
        transfersTo,
        sql`${accountBalance.accountId} = ${transfersTo.accountId}`,
      )
      .where(
        addresses
          ? inArray(accountBalance.accountId, addresses)
          : undefined,
      )
      .as("combined");

    const result = await this.db
      .select({
        accountId: combined.accountId,
        currentBalance: combined.currentBalance,
        absoluteChange:
          sql<string>`${combined.fromChange} + ${combined.toChange}`.as(
            "absolute_change",
          ),
      })
      .from(combined)
      .where(sql`(${combined.fromChange} + ${combined.toChange}) != 0`)
      .orderBy(
        orderDirection === "desc"
          ? desc(sql`ABS(${combined.fromChange} + ${combined.toChange})`)
          : asc(sql`ABS(${combined.fromChange} + ${combined.toChange})`),
      )
      .offset(skip)
      .limit(limit);

    return result.map(({ accountId, currentBalance, absoluteChange }) => ({
      accountId: accountId,
      previousBalance: currentBalance - BigInt(absoluteChange),
      currentBalance: currentBalance,
      absoluteChange: BigInt(absoluteChange),
      percentageChange: (currentBalance - BigInt(absoluteChange)
        ? Number(
          (BigInt(absoluteChange) * 10000n) /
          (currentBalance - BigInt(absoluteChange)),
        ) / 100
        : 0
      ).toString(),
    }));
  }
}
