import {
  and,
  gte,
  lte,
  SQL,
  sql,
} from "drizzle-orm";
import { Drizzle, transfer } from "@/database";
import { accountBalance } from "@/database";

export class AccountBalanceQueryFragments {
  constructor(private readonly db: Drizzle) { }

  variationCTE(
    fromTimestamp: number | undefined,
    toTimestamp: number | undefined,
    filter?: SQL,
  ) {
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

    const variations = this.db
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
      .where(filter)
      .as("variations");

    return variations
  }
}
