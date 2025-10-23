import { DBTransaction, TransactionsRequest } from "../mappers";
import { sql } from "drizzle-orm";
import { db } from "ponder:api";

export class TransactionsRepository {
  async getFilteredAggregateTransactions(
    filter: TransactionsRequest,
  ): Promise<DBTransaction[]> {
    const { transfer: transferFilter, delegation: delegationFilter } =
      this.filterToSql(filter);

    const query = sql`
    WITH filtered_transactions AS (
        SELECT DISTINCT transaction_hash
        FROM transfers
        WHERE ${sql.raw(transferFilter)}
        UNION
        SELECT DISTINCT transaction_hash
        FROM delegations
        WHERE ${sql.raw(delegationFilter)}
    ),
    latest_filtered_transactions AS (
        SELECT tx.transaction_hash, tx.from_address, tx.to_address, tx.is_cex, tx.is_dex, tx.is_lending, tx.is_total, tx.timestamp
        FROM transaction tx
        WHERE tx.transaction_hash IN (SELECT transaction_hash FROM filtered_transactions)
        ORDER BY tx.timestamp DESC
        LIMIT ${filter.limit}
    ),
    transfer_aggregates AS (
        SELECT transaction_hash, json_agg(json_build_object('transactionHash', transaction_hash, 'daoId', dao_id, 'tokenId', token_id, 'amount', amount, 'fromAccountId', from_account_id, 'toAccountId', to_account_id, 'timestamp', timestamp, 'logIndex', log_index, 'isCex', is_cex, 'isDex', is_dex, 'isLending', is_lending, 'isTotal', is_total)) as transfers
        FROM transfers
        WHERE transaction_hash IN (SELECT transaction_hash FROM latest_filtered_transactions)
        GROUP BY transaction_hash
    ),
    delegation_aggregates AS (
        SELECT transaction_hash, json_agg(json_build_object('transactionHash', transaction_hash, 'daoId', dao_id, 'delegateAccountId', delegate_account_id, 'delegatorAccountId', delegator_account_id, 'delegatedValue', delegated_value, 'previousDelegate', previous_delegate, 'timestamp', timestamp, 'logIndex', log_index, 'isCex', is_cex, 'isDex', is_dex, 'isLending', is_lending, 'isTotal', is_total)) as delegations
        FROM delegations
        WHERE transaction_hash IN (SELECT transaction_hash FROM latest_filtered_transactions)
        GROUP BY transaction_hash
    )
    SELECT lt.transaction_hash AS "transactionHash", lt.from_address AS "fromAddress", lt.to_address AS "toAddress", lt.is_cex AS "isCex", lt.is_dex AS "isDex", lt.is_lending AS "isLending", lt.is_total AS "isTotal", lt.timestamp, COALESCE(ta.transfers, '[]'::json) as transfers, COALESCE(da.delegations, '[]'::json) as delegations
    FROM latest_filtered_transactions lt
    LEFT JOIN transfer_aggregates ta ON ta.transaction_hash = lt.transaction_hash
    LEFT JOIN delegation_aggregates da ON da.transaction_hash = lt.transaction_hash
    ORDER BY lt.timestamp DESC;
`;
    const result = await db.execute<DBTransaction>(query);

    return result.rows;
  }

  async getRecentAggregateTransactions(
    params: TransactionsRequest,
  ): Promise<DBTransaction[]> {
    const timePeriodConditions = this.coalesceConditionArray(
      this.timePeriodToSql(params),
    );

    const query = sql`
    SELECT tx.transaction_hash AS "transactionHash", tx.from_address AS "fromAddress", tx.to_address AS "toAddress", tx.is_cex AS "isCex", tx.is_dex AS "isDex", tx.is_lending AS "isLending", tx.is_total AS "isTotal", tx.timestamp, COALESCE(transfers_agg.transfers, '[]'::json) as transfers, COALESCE(delegations_agg.delegations, '[]'::json) as delegations
    FROM (
        SELECT transaction_hash, from_address, to_address, is_cex, is_dex, is_lending, is_total, timestamp
        FROM transaction
        WHERE ${sql.raw(timePeriodConditions)}
        ORDER BY timestamp ${sql.raw(params.sortOrder)}
        LIMIT ${params.limit} OFFSET ${params.offset}
    ) tx
    LEFT JOIN LATERAL (
        SELECT JSON_AGG(JSON_BUILD_OBJECT('transactionHash', tr.transaction_hash, 'daoId', tr.dao_id, 'tokenId', tr.token_id, 'amount', tr.amount, 'fromAccountId', tr.from_account_id, 'toAccountId', tr.to_account_id, 'timestamp', tr.timestamp, 'logIndex', tr.log_index, 'isCex', tr.is_cex, 'isDex', tr.is_dex, 'isLending', tr.is_lending, 'isTotal', tr.is_total)) as transfers
        FROM transfers tr
        WHERE tr.transaction_hash = tx.transaction_hash
    ) transfers_agg ON true
    LEFT JOIN LATERAL (
        SELECT JSON_AGG(JSON_BUILD_OBJECT('transactionHash', dg.transaction_hash, 'daoId', dg.dao_id, 'delegateAccountId', dg.delegate_account_id, 'delegatorAccountId', dg.delegator_account_id, 'delegatedValue', dg.delegated_value, 'previousDelegate', dg.previous_delegate, 'timestamp', dg.timestamp, 'logIndex', dg.log_index, 'isCex', dg.is_cex, 'isDex', dg.is_dex, 'isLending', dg.is_lending, 'isTotal', dg.is_total)) as delegations
        FROM delegations dg
        WHERE dg.transaction_hash = tx.transaction_hash
    ) delegations_agg ON true
    ORDER BY tx.timestamp ${sql.raw(params.sortOrder)};
`;
    const result = await db.execute<DBTransaction>(query);

    return result.rows;
  }

  private filterToSql(filter: TransactionsRequest): {
    transfer: string;
    delegation: string;
  } {
    const checkIsDex = filter.affectedSupply.isDex ?? false;
    const checkIsCex = filter.affectedSupply.isCex ?? false;
    const checkIsLending = filter.affectedSupply.isLending ?? false;
    const checkIsTotal = filter.affectedSupply.isTotal ?? false;

    const transferConditions: string[] = [];
    const delegationConditions: string[] = [];
    const timePeriodConditions: string[] = this.timePeriodToSql(filter);

    transferConditions.push(...timePeriodConditions);
    if (checkIsDex) transferConditions.push("is_dex = true");
    if (checkIsCex) transferConditions.push("is_cex = true");
    if (checkIsLending) transferConditions.push("is_lending = true");
    if (checkIsTotal) transferConditions.push("is_total = true");
    if (filter.minAmount != null)
      transferConditions.push(`amount >= ${filter.minAmount}`);
    if (filter.maxAmount != null)
      transferConditions.push(`amount <= ${filter.maxAmount}`);
    if (filter.from != null)
      transferConditions.push(`from_account_id = '${filter.from}'`);
    if (filter.to != null)
      transferConditions.push(`to_account_id = '${filter.to}'`);

    delegationConditions.push(...timePeriodConditions);
    if (checkIsDex) delegationConditions.push("is_dex = true");
    if (checkIsCex) delegationConditions.push("is_cex = true");
    if (checkIsLending) delegationConditions.push("is_lending = true");
    if (checkIsTotal) delegationConditions.push("is_total = true");
    if (filter.minAmount != null)
      delegationConditions.push(`delegated_value >= ${filter.minAmount}`);
    if (filter.maxAmount != null)
      delegationConditions.push(`delegated_value <= ${filter.maxAmount}`);
    if (filter.from != null)
      delegationConditions.push(`delegator_account_id = '${filter.from}'`);
    if (filter.to != null)
      delegationConditions.push(`delegate_account_id = '${filter.to}'`);

    return {
      transfer: this.coalesceConditionArray(transferConditions),
      delegation: this.coalesceConditionArray(delegationConditions),
    };
  }

  private timePeriodToSql(filter: TransactionsRequest): string[] {
    const filterConditions: string[] = [];

    if (filter.fromDate)
      filterConditions.push(`timestamp >= ${BigInt(filter.fromDate)}`);
    if (filter.toDate)
      filterConditions.push(`timestamp <= ${BigInt(filter.toDate)}`);

    return filterConditions;
  }

  private coalesceConditionArray(conditions: string[]): string {
    return conditions.length > 0 ? conditions.join(" AND ") : "true";
  }
}
