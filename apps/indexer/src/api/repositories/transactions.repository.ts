import { db } from "ponder:api";
import { sql } from "ponder";
import { TransactionsRequest } from "../mappers";

export class TransactionsRepository {
  async getAggregateTransactions(filter: TransactionsRequest) {
    const checkIsDex = filter.affectedSupply.isDex ?? false;
    const checkIsCex = filter.affectedSupply.isCex ?? false;
    const checkIsLending = filter.affectedSupply.isLending ?? false;
    const checkIsTotal = filter.affectedSupply.isTotal ?? false;

    const query = sql`
      WITH filtered_transfers AS (
          SELECT 
              tfs.*
          FROM transfers tfs
          WHERE (
              (${checkIsDex} = false OR tfs.is_dex = true) AND
              (${checkIsCex} = false OR tfs.is_cex = true) AND
              (${checkIsLending} = false OR tfs.is_lending = true) AND
              (${checkIsTotal} = false OR tfs.is_total = true)
              ${filter.minAmount != null ? sql`AND tfs.amount >= ${filter.minAmount}` : sql``}
              ${filter.maxAmount != null ? sql`AND tfs.amount <= ${filter.maxAmount}` : sql``}
              ${filter.from != null ? sql`AND tfs.from_account_id = ${filter.from}` : sql``}
              ${filter.to != null ? sql`AND tfs.to_account_id = ${filter.to}` : sql``}
          )
      ),
      filtered_delegations AS (
          SELECT 
              dgs.*
          FROM delegations dgs
          WHERE (
              (${checkIsDex} = false OR dgs.is_dex = true) AND
              (${checkIsCex} = false OR dgs.is_cex = true) AND
              (${checkIsLending} = false OR dgs.is_lending = true) AND
              (${checkIsTotal} = false OR dgs.is_total = true)
              ${filter.minAmount != null ? sql`AND dgs.delegated_value >= ${filter.minAmount}` : sql``}
              ${filter.maxAmount != null ? sql`AND dgs.delegated_value <= ${filter.maxAmount}` : sql``}
              ${filter.from != null ? sql`AND dgs.delegator_account_id = ${filter.from}` : sql``}
              ${filter.to != null ? sql`AND dgs.delegate_account_id = ${filter.to}` : sql``}
          )
      ),
      transfer_agg AS (
          SELECT 
              transaction_hash,
              ARRAY_AGG(ROW(ft.*)) as transfers
          FROM filtered_transfers ft
          GROUP BY transaction_hash
      ),
      delegation_agg AS (
          SELECT 
              transaction_hash,
              ARRAY_AGG(ROW(fd.*)) as delegations
          FROM filtered_delegations fd
          GROUP BY transaction_hash
      )
      SELECT
          tx.transaction_hash AS tx_id,
          tx."timestamp" AS tx_timestamp,
          COALESCE(ta.transfers, ARRAY[]::record[]) as tx_transfers,
          COALESCE(da.delegations, ARRAY[]::record[]) as tx_delegations
      FROM "transaction" tx
      LEFT JOIN transfer_agg ta ON ta.transaction_hash = tx.transaction_hash
      LEFT JOIN delegation_agg da ON da.transaction_hash = tx.transaction_hash
      WHERE ta.transaction_hash IS NOT NULL OR da.transaction_hash IS NOT NULL
      ORDER BY 
          CASE WHEN ${filter.sortOrder} = 'asc' THEN tx."timestamp" END ASC,
          CASE WHEN ${filter.sortOrder} = 'desc' THEN tx."timestamp" END DESC
      LIMIT ${filter.limit}
      OFFSET ${filter.offset}
    `;

    return await db.execute(query);
  }
}
