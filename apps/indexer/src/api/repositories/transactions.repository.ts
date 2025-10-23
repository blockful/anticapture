import { transfer, delegation } from "ponder:schema";
import { DBTransaction, TransactionsRequest } from "../mappers";
import { sql, eq, gte, lte, SQL } from "drizzle-orm";
import { db } from "ponder:api";

export class TransactionsRepository {
  async getFilteredAggregateTransactions(
    _filter: TransactionsRequest,
  ): Promise<DBTransaction[]> {
    // WITH filtered_transactions AS (
    //     SELECT DISTINCT transaction_hash
    //     FROM transfers
    //     WHERE ...
    //     UNION
    //     SELECT DISTINCT transaction_hash
    //     FROM delegations
    //     WHERE ...
    // ),
    // latest_filtered_transactions AS (
    //     SELECT tx.transaction_hash, tx.timestamp
    //     FROM transaction tx
    //     WHERE tx.transaction_hash IN (SELECT transaction_hash FROM filtered_transactions)
    //     ORDER BY tx.timestamp DESC
    //     LIMIT 100
    // ),
    // transfer_aggregates AS (
    //     SELECT
    //         transaction_hash,
    //         json_agg(json_build_object(
    //          'transactionHash', transaction_hash, 'daoId', dao_id, 'tokenId', token_id, 'amount', amount, 'fromAccountId', from_account_id, 'toAccountId', to_account_id, 'timestamp', timestamp, 'logIndex', log_index, 'isCex', is_cex, 'isDex', is_dex, 'isLending', is_lending, 'isTotal', is_total
    //         )) as transfers
    //     FROM transfers
    //     WHERE transaction_hash IN (SELECT transaction_hash FROM latest_filtered_transactions)
    //     GROUP BY transaction_hash
    // ),
    // delegation_aggregates AS (
    //     SELECT
    //         transaction_hash,
    //         json_agg(json_build_object(
    //          'transactionHash', transaction_hash, 'daoId', dao_id, 'delegateAccountId', delegate_account_id, 'delegatorAccountId', delegator_account_id, 'delegatedValue', delegated_value, 'previousDelegate', previous_delegate, 'timestamp', timestamp, 'logIndex', log_index, 'isCex', is_cex, 'isDex', is_dex, 'isLending', is_lending, 'isTotal', is_total
    //         )) as delegations
    //     FROM delegations
    //     WHERE transaction_hash IN (SELECT transaction_hash FROM latest_filtered_transactions)
    //     GROUP BY transaction_hash
    // )
    // SELECT
    //     lt.transaction_hash,
    //     lt.timestamp,
    //     COALESCE(ta.transfers, '[]'::json) as transfers,
    //     COALESCE(da.delegations, '[]'::json) as delegations
    // FROM latest_filtered_transactions lt
    // LEFT JOIN transfer_aggregates ta ON ta.transaction_hash = lt.transaction_hash
    // LEFT JOIN delegation_aggregates da ON da.transaction_hash = lt.transaction_hash
    // ORDER BY lt.timestamp DESC;

    return [];
  }

  async getRecentAggregateTransactions(
    params: TransactionsRequest,
  ): Promise<DBTransaction[]> {
    const query = sql`
    SELECT
        tx.transaction_hash AS "transactionHash",
        tx.from_address AS "fromAddress",
        tx.to_address AS "toAddress",
        tx.is_cex AS "isCex",
        tx.is_dex AS "isDex",
        tx.is_lending AS "isLending",
        tx.is_total AS "isTotal",
        tx.timestamp,
        COALESCE(transfers_agg.transfers, '[]'::json) as transfers,
        COALESCE(delegations_agg.delegations, '[]'::json) as delegations
    FROM (
        SELECT transaction_hash, from_address, to_address, is_cex, is_dex, is_lending, is_total, timestamp
        FROM transaction
        ORDER BY timestamp ${sql.raw(params.sortOrder)}
        LIMIT ${params.limit} OFFSET ${params.offset}
    ) tx
    LEFT JOIN LATERAL (
        SELECT JSON_AGG(JSON_BUILD_OBJECT(
          'transactionHash', tr.transaction_hash, 'daoId', tr.dao_id, 'tokenId', tr.token_id, 'amount', tr.amount, 'fromAccountId', tr.from_account_id, 'toAccountId', tr.to_account_id, 'timestamp', tr.timestamp, 'logIndex', tr.log_index, 'isCex', tr.is_cex, 'isDex', tr.is_dex, 'isLending', tr.is_lending, 'isTotal', tr.is_total
        )) as transfers
        FROM transfers tr
        WHERE tr.transaction_hash = tx.transaction_hash
    ) transfers_agg ON true
    LEFT JOIN LATERAL (
        SELECT JSON_AGG(JSON_BUILD_OBJECT(
          'transactionHash', dg.transaction_hash, 'daoId', dg.dao_id, 'delegateAccountId', dg.delegate_account_id, 'delegatorAccountId', dg.delegator_account_id, 'delegatedValue', dg.delegated_value, 'previousDelegate', dg.previous_delegate, 'timestamp', dg.timestamp, 'logIndex', dg.log_index, 'isCex', dg.is_cex, 'isDex', dg.is_dex, 'isLending', dg.is_lending, 'isTotal', dg.is_total
        )) as delegations
        FROM delegations dg
        WHERE dg.transaction_hash = tx.transaction_hash
    ) delegations_agg ON true
    ORDER BY tx.timestamp ${sql.raw(params.sortOrder)};
`;
    const result = await db.execute<DBTransaction>(query);

    return result.rows;
  }

  private buildWhere = (
    filter: TransactionsRequest,
  ): {
    transfer: SQL[];
    delegation: SQL[];
  } => {
    const checkIsDex = filter.affectedSupply.isDex ?? false;
    const checkIsCex = filter.affectedSupply.isCex ?? false;
    const checkIsLending = filter.affectedSupply.isLending ?? false;
    const checkIsTotal = filter.affectedSupply.isTotal ?? false;

    return {
      transfer: [
        checkIsDex ? eq(transfer.isDex, true) : sql`true`,
        checkIsCex ? eq(transfer.isCex, true) : sql`true`,
        checkIsLending ? eq(transfer.isLending, true) : sql`true`,
        checkIsTotal ? eq(transfer.isTotal, true) : sql`true`,
        ...(filter.minAmount != null
          ? [gte(transfer.amount, filter.minAmount)]
          : []),
        ...(filter.maxAmount != null
          ? [lte(transfer.amount, filter.maxAmount)]
          : []),
        ...(filter.from != null
          ? [eq(transfer.fromAccountId, filter.from)]
          : []),
        ...(filter.to != null ? [eq(transfer.toAccountId, filter.to)] : []),
      ],
      delegation: [
        checkIsDex ? eq(delegation.isDex, true) : sql`true`,
        checkIsCex ? eq(delegation.isCex, true) : sql`true`,
        checkIsLending ? eq(delegation.isLending, true) : sql`true`,
        checkIsTotal ? eq(delegation.isTotal, true) : sql`true`,
        ...(filter.minAmount != null
          ? [gte(delegation.delegatedValue, filter.minAmount)]
          : []),
        ...(filter.maxAmount != null
          ? [lte(delegation.delegatedValue, filter.maxAmount)]
          : []),
        ...(filter.from != null
          ? [eq(delegation.delegatorAccountId, filter.from)]
          : []),
        ...(filter.to != null
          ? [eq(delegation.delegateAccountId, filter.to)]
          : []),
      ],
    };
  };
}
