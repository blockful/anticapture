import { db } from "ponder:api";
import { transaction } from "ponder:schema";
import { asc, desc, inArray, sql } from "ponder";
import { TransactionsRequest } from "../mappers";

export class TransactionsRepository {
  async getTransactionsByHashesOnly(
    hashes: string[],
    limit: number,
    orderBy: "asc" | "desc",
  ) {
    return db.query.transaction.findMany({
      where: inArray(transaction.transactionHash, hashes),
      limit,
      orderBy:
        orderBy === "asc"
          ? asc(transaction.timestamp)
          : desc(transaction.timestamp),
      with: {
        transfers: true,
        delegations: true,
      },
    });
  }

  async getAggregateTransactions(filter: TransactionsRequest) {
    const query = sql`select
        tx.transaction_hash AS tx_id,
        tx."timestamp" AS tx_timestamp,
        COALESCE(
        ARRAY_AGG(ROW(tfs.*))
        FILTER(WHERE tfs.transaction_hash IS NOT NULL),
        ARRAY[]::record[]
        ) as tx_transfers,
        COALESCE(
        ARRAY_AGG(ROW(dgs.*))
        filter(WHERE dgs.transaction_hash IS NOT NULL),
        ARRAY[]::record[]) as tx_delegations
    FROM "transaction" tx
    LEFT JOIN transfers tfs ON tfs.transaction_hash = tx.transaction_hash
    LEFT JOIN delegations dgs ON dgs.transaction_hash = tx.transaction_hash
    where (
        (tfs.transaction_hash IS NOT NULL AND (
            (${filter.affectedSupply.isDex} IS NULL OR ${filter.affectedSupply.isDex} = false OR tfs.is_dex = true) AND
            (${filter.affectedSupply.isCex} IS NULL OR ${filter.affectedSupply.isCex} = false OR tfs.is_cex = true) AND
            (${filter.affectedSupply.isLending} IS NULL OR ${filter.affectedSupply.isLending} = false OR tfs.is_lending = true) AND
            (${filter.affectedSupply.isTotal} IS NULL OR ${filter.affectedSupply.isTotal} = false OR tfs.is_total = true) AND
            (${filter.minAmount} IS NULL OR tfs.amount >= ${filter.minAmount}) AND
            (${filter.maxAmount} IS NULL OR tfs.amount <= ${filter.maxAmount}) AND
            (${filter.from} IS NULL OR tfs.from_account_id = ${filter.from}) AND
            (${filter.to} IS NULL OR tfs.to_account_id = ${filter.to})
        )) OR (dgs.transaction_hash IS NOT NULL AND (
            (${filter.affectedSupply.isDex} IS NULL OR ${filter.affectedSupply.isDex} = false OR dgs.is_dex = true) AND
            (${filter.affectedSupply.isCex} IS NULL OR ${filter.affectedSupply.isCex} = false OR dgs.is_cex = true) AND
            (${filter.affectedSupply.isLending} IS NULL OR ${filter.affectedSupply.isLending} = false OR dgs.is_lending = true) AND
            (${filter.affectedSupply.isTotal} IS NULL OR ${filter.affectedSupply.isTotal} = false OR dgs.is_total = true) AND
            (${filter.minAmount} IS NULL OR dgs.delegated_value >= ${filter.minAmount}) AND
            (${filter.maxAmount} IS NULL OR dgs.delegated_value <= ${filter.maxAmount}) AND
            (${filter.from} IS NULL OR dgs.delegator_account_id = ${filter.from}) AND
            (${filter.to} IS NULL OR dgs.delegate_account_id = ${filter.to})
        )))
    GROUP BY tx.transaction_hash, tx."timestamp"
    HAVING ARRAY_AGG(tfs.transaction_hash) IS NOT NULL
        OR ARRAY_AGG(dgs.transaction_hash) IS NOT NULL
    ORDER BY 
        CASE WHEN ${filter.sortOrder} = 'asc' THEN tx_timestamp END ASC,
        CASE WHEN ${filter.sortOrder} = 'desc' THEN tx_timestamp END DESC
    LIMIT ${filter.limit}
    OFFSET ${filter.offset};
`;
    const result = await db.execute(query);
    console.log(result);
  }
}
