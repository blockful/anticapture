import { AmountFilter, DBAccountBalance, DBAccountBalanceWithVariation } from "@/mappers";
import {
  and,
  asc,
  desc,
  eq,
  gt,
  gte,
  inArray,
  lt,
  lte,
  not,
  SQL,
  sql,
} from "drizzle-orm";
import { Drizzle, transfer } from "@/database";
import { accountBalance } from "@/database";
import { Address, getAddress } from "viem";

export class AccountBalanceRepository {
  constructor(private readonly db: Drizzle) { }

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

    // Get total count with filters
    const totalCount = await this.db
      .select({
        count: sql<number>`COUNT(*)`.as("count"),
      })
      .from(accountBalance)
      .where(filter);

    // Get paginated results
    const page = await this.db
      .select()
      .from(accountBalance)
      .where(filter)
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
    const [result] = await this.db
      .select()
      .from(accountBalance)
      .where(eq(accountBalance.accountId, accountId))
      .limit(1);

    return result;
  }

  async getAccountBalancesWithVariation(
    variationFromTimestamp: number,
    variationToTimestamp: number,
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
    orderBy: "balance" | "variation",
    addresses: Address[],
    delegates: Address[],
    excludeAddresses: Address[],
    amountfilter: AmountFilter,
  ): Promise<{
    items: DBAccountBalanceWithVariation[];
    totalCount: bigint;
  }> {
    const filter = this.filterToSql(
      addresses,
      delegates,
      excludeAddresses,
      amountfilter,
    );

    const scopedTransfers = this.db
      .select()
      .from(transfer)
      .where(
        and(
          variationFromTimestamp
            ? gte(transfer.timestamp, BigInt(variationFromTimestamp))
            : undefined,
          variationToTimestamp
            ? lte(transfer.timestamp, BigInt(variationToTimestamp))
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
        tokenId: accountBalance.tokenId,
        delegate: accountBalance.delegate,
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
        and(
          filter,
        )
      )
      .as("combined");

    const [totalCount] = await this.db
      .select({
        count: sql<number>`COUNT(*)`.as("count"),
      })
      .from(combined)

    const orderDirectionFn = orderDirection === "desc"
      ? desc
      : asc;

    const orderByCriteria = orderBy === "balance"
      ? combined.currentBalance
      : sql`ABS(${combined.fromChange} + ${combined.toChange})`;

    const result = await this.db
      .select({
        accountId: combined.accountId,
        tokenId: combined.tokenId,
        delegate: combined.delegate,
        currentBalance: combined.currentBalance,
        absoluteChange:
          sql<string>`${combined.fromChange} + ${combined.toChange}`.as(
            "absolute_change",
          ),
      })
      .from(combined)
      .orderBy(orderDirectionFn(orderByCriteria))
      .offset(skip)
      .limit(limit);

    return {
      items: result.map(({ accountId, tokenId, delegate, currentBalance, absoluteChange }) => ({
        accountId: accountId,
        tokenId: getAddress(tokenId),
        delegate: getAddress(delegate),
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
      })),
      totalCount: BigInt(totalCount?.count ?? 0),
    };
  }

  async getAccountBalanceWithVariation(
    accountId: Address,
    variationFromTimestamp: number,
    variationToTimestamp: number,
  ): Promise<DBAccountBalanceWithVariation | undefined> {
    const scopedTransfers = this.db
      .select()
      .from(transfer)
      .where(
        and(
          variationFromTimestamp
            ? gte(transfer.timestamp, BigInt(variationFromTimestamp))
            : undefined,
          variationToTimestamp
            ? lte(transfer.timestamp, BigInt(variationToTimestamp))
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
        tokenId: accountBalance.tokenId,
        delegate: accountBalance.delegate,
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
      .where(eq(accountBalance.accountId, accountId))
      .as("combined");

    const [result] = await this.db
      .select({
        accountId: combined.accountId,
        tokenId: combined.tokenId,
        delegate: combined.delegate,
        currentBalance: combined.currentBalance,
        absoluteChange:
          sql<string>`${combined.fromChange} + ${combined.toChange}`.as(
            "absolute_change",
          ),
      })
      .from(combined)
      .where(sql`(${combined.fromChange} + ${combined.toChange}) != 0`);

    if (!result) return undefined

    return {
      accountId: result.accountId,
      tokenId: getAddress(result.tokenId),
      delegate: getAddress(result.delegate),
      previousBalance: result.currentBalance - BigInt(result.absoluteChange),
      currentBalance: result.currentBalance,
      absoluteChange: BigInt(result.absoluteChange),
      percentageChange: (result.currentBalance - BigInt(result.absoluteChange)
        ? Number(
          (BigInt(result.absoluteChange) * 10000n) /
          (result.currentBalance - BigInt(result.absoluteChange)),
        ) / 100
        : 0
      ).toString(),
    };
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

    if (
      amountfilter.minAmount !== null &&
      amountfilter.minAmount !== undefined
    ) {
      conditions.push(
        gt(accountBalance.balance, BigInt(amountfilter.minAmount)),
      );
    }

    if (
      amountfilter.maxAmount !== null &&
      amountfilter.maxAmount !== undefined
    ) {
      conditions.push(
        lt(accountBalance.balance, BigInt(amountfilter.maxAmount)),
      );
    }

    if (excludeAddresses.length) {
      conditions.push(not(inArray(accountBalance.accountId, excludeAddresses)));
    }

    return and(...conditions);
  }
}
