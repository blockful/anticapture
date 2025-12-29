import { asc, desc, gte, sql, eq, ne, and } from "ponder";
import { db } from "ponder:api";
import { transfer, accountBalance } from "ponder:schema";
import { Address, zeroAddress } from "viem";
import { DBTokenHolder, TokenHoldersFilter } from "@/api/mappers/token-holders";

export class TokenHoldersRepository {
  async getTokenHolders(
    startTimestamp: number,
    limit: number,
    skip: number,
    orderBy: "balance" | "variation",
    orderDirection: "asc" | "desc",
    filter: TokenHoldersFilter,
  ): Promise<{ totalCount: number; items: DBTokenHolder[] }> {
    // Aggregate outgoing transfers (negative amounts)
    const transfersFrom = db
      .select({
        accountId: transfer.fromAccountId,
        fromAmount: sql<string>`-SUM(${transfer.amount})`.as("from_amount"),
      })
      .from(transfer)
      .where(gte(transfer.timestamp, BigInt(startTimestamp)))
      .groupBy(transfer.fromAccountId)
      .as("transfers_from");

    // Aggregate incoming transfers (positive amounts)
    const transfersTo = db
      .select({
        accountId: transfer.toAccountId,
        toAmount: sql<string>`SUM(${transfer.amount})`.as("to_amount"),
      })
      .from(transfer)
      .where(gte(transfer.timestamp, BigInt(startTimestamp)))
      .groupBy(transfer.toAccountId)
      .as("transfers_to");

    // Build where conditions for filters
    const whereConditions = [sql`${accountBalance.balance} > 0`];

    if (filter.address) {
      whereConditions.push(eq(accountBalance.accountId, filter.address));
    }

    if (filter.delegate === "nonzero") {
      whereConditions.push(ne(accountBalance.delegate, zeroAddress));
    } else if (filter.delegate) {
      whereConditions.push(eq(accountBalance.delegate, filter.delegate));
    }

    // Combine account_balance with transfer aggregations
    const combined = db
      .select({
        accountId: accountBalance.accountId,
        balance: accountBalance.balance,
        delegate: accountBalance.delegate,
        variation:
          sql<string>`COALESCE(${transfersFrom.fromAmount}, 0) + COALESCE(${transfersTo.toAmount}, 0)`.as(
            "variation",
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
      .where(and(...whereConditions))
      .as("combined");

    // Build order by clause
    const orderByClause =
      orderBy === "variation"
        ? orderDirection === "desc"
          ? desc(combined.variation)
          : asc(combined.variation)
        : orderDirection === "desc"
          ? desc(combined.balance)
          : asc(combined.balance);

    // Get items with pagination
    const items = await db
      .select({
        accountId: combined.accountId,
        balance: combined.balance,
        delegate: combined.delegate,
        variation: combined.variation,
      })
      .from(combined)
      .orderBy(orderByClause)
      .offset(skip)
      .limit(limit);

    // Get total count
    const countResult = await db
      .select({
        count: sql<number>`COUNT(*)`.as("count"),
      })
      .from(combined);

    const totalCount = countResult[0]?.count ?? 0;

    return {
      totalCount,
      items: items.map(({ accountId, balance, delegate, variation }) => ({
        accountId: accountId as Address,
        balance: balance,
        delegate: delegate as Address,
        variation: BigInt(variation),
      })),
    };
  }
}
