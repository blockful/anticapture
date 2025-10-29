import { DBTransaction, TransactionsRequest } from "../mappers";
import { sql, eq, or, countDistinct } from "drizzle-orm";
import { db } from "ponder:api";
import { delegation, transaction, transfer } from "ponder:schema";

export class TransactionsRepository {
  async getFilteredAggregateTransactions(
    filter: TransactionsRequest,
  ): Promise<DBTransaction[]> {
    const { transfer: transferFilter, delegation: delegationFilter } =
      this.filterToSql(filter);

    const query = sql`
    WITH filtered_transactions AS (
        SELECT DISTINCT ${transfer.transactionHash}
        FROM ${transfer}
        WHERE ${sql.raw(transferFilter)}
        UNION
        SELECT DISTINCT ${delegation.transactionHash}
        FROM ${delegation}
        WHERE ${sql.raw(delegationFilter)}
    ),
    latest_filtered_transactions AS (
        SELECT 
          ${transaction.transactionHash},
          ${transaction.fromAddress},
          ${transaction.toAddress},
          ${transaction.isCex},
          ${transaction.isDex},
          ${transaction.isLending},
          ${transaction.isTotal},
          ${transaction.timestamp}
        FROM ${transaction}
        WHERE ${transaction.transactionHash} IN (SELECT transaction_hash FROM filtered_transactions)
        ORDER BY ${transaction.timestamp} DESC
        LIMIT ${filter.limit}
    ),
    transfer_aggregates AS (
        SELECT 
          ${transfer.transactionHash},
          JSON_AGG(JSON_BUILD_OBJECT(
            'transactionHash', ${transfer.transactionHash},
            'daoId', ${transfer.daoId},
            'tokenId', ${transfer.tokenId},
            'amount', ${transfer.amount},
            'fromAccountId', ${transfer.fromAccountId},
            'toAccountId', ${transfer.toAccountId},
            'timestamp', ${transfer.timestamp},
            'logIndex', ${transfer.logIndex},
            'isCex', ${transfer.isCex},
            'isDex', ${transfer.isDex},
            'isLending', ${transfer.isLending},
            'isTotal', ${transfer.isTotal}
          )) as transfers
        FROM ${transfer}
        WHERE ${transfer.transactionHash} IN (SELECT transaction_hash FROM latest_filtered_transactions)
        GROUP BY ${transfer.transactionHash}
    ),
    delegation_aggregates AS (
        SELECT 
          ${delegation.transactionHash},
          JSON_AGG(JSON_BUILD_OBJECT(
            'transactionHash', ${delegation.transactionHash},
            'daoId', ${delegation.daoId},
            'delegateAccountId', ${delegation.delegateAccountId},
            'delegatorAccountId', ${delegation.delegatorAccountId},
            'delegatedValue', ${delegation.delegatedValue},
            'previousDelegate', ${delegation.previousDelegate},
            'timestamp', ${delegation.timestamp},
            'logIndex', ${delegation.logIndex},
            'isCex', ${delegation.isCex},
            'isDex', ${delegation.isDex},
            'isLending', ${delegation.isLending},
            'isTotal', ${delegation.isTotal}
          )) as delegations
        FROM ${delegation}
        WHERE ${delegation.transactionHash} IN (SELECT ${delegation.transactionHash} FROM latest_filtered_transactions)
        GROUP BY ${delegation.transactionHash}
    )
    SELECT 
      lt.transaction_hash AS "transactionHash",
      lt.from_address AS "fromAddress", 
      lt.to_address AS "toAddress",
      lt.is_cex AS "isCex",
      lt.is_dex AS "isDex",
      lt.is_lending AS "isLending", 
      lt.is_total AS "isTotal", 
      lt.timestamp,
      COALESCE(ta.transfers, '[]'::json) as transfers,
      COALESCE(da.delegations, '[]'::json) as delegations
    FROM latest_filtered_transactions lt
    LEFT JOIN transfer_aggregates ta ON ta.transaction_hash = lt.transaction_hash
    LEFT JOIN delegation_aggregates da ON da.transaction_hash = lt.transaction_hash
    ORDER BY lt.timestamp DESC;
`;
    const result = await db.execute<DBTransaction>(query);

    return result.rows;
  }

  async getFilteredAggregateTransactionsCount(
    filter: TransactionsRequest,
  ): Promise<number> {
    const { transfer: transferFilter, delegation: delegationFilter } =
      this.filterToSql(filter);

    const query = await db
      .select({
        count: countDistinct(
          sql`coalesce(${transfer.transactionHash}, ${delegation.transactionHash})`,
        ),
      })
      .from(transfer)
      .fullJoin(
        delegation,
        eq(transfer.transactionHash, delegation.transactionHash),
      )
      .where(or(sql.raw(transferFilter), sql.raw(delegationFilter)));

    return query[0]?.count || 0;
  }

  async getRecentAggregateTransactions(
    params: TransactionsRequest,
  ): Promise<DBTransaction[]> {
    const timePeriodConditions = this.coalesceConditionArray(
      this.timePeriodToSql(params),
    );

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
            SELECT
              ${transaction.transactionHash},
              ${transaction.fromAddress},
              ${transaction.toAddress},
              ${transaction.isCex},
              ${transaction.isDex},
              ${transaction.isLending},
              ${transaction.isTotal},
              ${transaction.timestamp}
            FROM ${transaction}
            WHERE ${sql.raw(timePeriodConditions)}
            ORDER BY timestamp ${sql.raw(params.sortOrder)}
            LIMIT ${params.limit} OFFSET ${params.offset}
        ) tx
        LEFT JOIN LATERAL (
            SELECT
              JSON_AGG(JSON_BUILD_OBJECT(
                'transactionHash', ${transfer.transactionHash},
                'daoId', ${transfer.daoId},
                'tokenId', ${transfer.tokenId},
                'amount', ${transfer.amount},
                'fromAccountId', ${transfer.fromAccountId},
                'toAccountId', ${transfer.toAccountId},
                'timestamp', ${transfer.timestamp},
                'logIndex', ${transfer.logIndex},
                'isCex', ${transfer.isCex},
                'isDex', ${transfer.isDex},
                'isLending', ${transfer.isLending},
                'isTotal', ${transfer.isTotal}
              )) as transfers
            FROM ${transfer}
            WHERE ${transfer.transactionHash} = tx.transaction_hash
        ) transfers_agg ON true
        LEFT JOIN LATERAL (
            SELECT
              JSON_AGG(JSON_BUILD_OBJECT(
                'transactionHash', ${delegation.transactionHash},
                'daoId', ${delegation.daoId},
                'delegateAccountId', ${delegation.delegateAccountId},
                'delegatorAccountId', ${delegation.delegatorAccountId},
                'delegatedValue', ${delegation.delegatedValue},
                'previousDelegate', ${delegation.previousDelegate},
                'timestamp', ${delegation.timestamp},
                'logIndex', ${delegation.logIndex},
                'isCex', ${delegation.isCex},
                'isDex', ${delegation.isDex},
                'isLending', ${delegation.isLending},
                'isTotal', ${delegation.isTotal}
              )) as delegations
            FROM ${delegation}
            WHERE ${delegation.transactionHash} = tx.transaction_hash
        ) delegations_agg ON true
        ORDER BY tx.timestamp ${sql.raw(params.sortOrder)};
    `;
    const result = await db.execute<DBTransaction>(query);

    return result.rows;
  }

  async getRecentAggregateTransactionsCount(
    params: TransactionsRequest,
  ): Promise<number> {
    const timePeriodConditions = this.coalesceConditionArray(
      this.timePeriodToSql(params),
    );

    const query = await db
      .select({
        count: countDistinct(
          sql`coalesce(${transfer.transactionHash}, ${delegation.transactionHash})`,
        ),
      })
      .from(transfer)
      .fullJoin(
        delegation,
        eq(transfer.transactionHash, delegation.transactionHash),
      )
      .where(sql.raw(timePeriodConditions));

    return query[0]?.count || 0;
  }

  private filterToSql(filter: TransactionsRequest): {
    transfer: string;
    delegation: string;
  } {
    const checkIsDex = filter.affectedSupply.isDex ?? false;
    const checkIsCex = filter.affectedSupply.isCex ?? false;
    const checkIsLending = filter.affectedSupply.isLending ?? false;
    const checkIsTotal = filter.affectedSupply.isTotal ?? false;

    const timePeriodConditions: string[] = this.timePeriodToSql(filter);

    const transferConditions: string[] = [...timePeriodConditions];
    const delegationConditions: string[] = [...timePeriodConditions];

    if (checkIsDex) {
      transferConditions.push(`transfers.is_dex = true`);
      delegationConditions.push(`delegations.is_dex = true`);
    }
    if (checkIsCex) {
      transferConditions.push(`transfers.is_cex = true`);
      delegationConditions.push(`delegations.is_cex = true`);
    }
    if (checkIsLending) {
      transferConditions.push(`transfers.is_lending = true`);
      delegationConditions.push(`delegations.is_lending = true`);
    }
    if (checkIsTotal) {
      transferConditions.push(`transfers.is_total = true`);
      delegationConditions.push(`delegations.is_total = true`);
    }

    if (filter.minAmount != null) {
      transferConditions.push(`transfers.amount >= ${filter.minAmount}`);
      delegationConditions.push(
        `delegations.delegated_value >= ${filter.minAmount}`,
      );
    }
    if (filter.maxAmount != null) {
      transferConditions.push(`transfers.amount <= ${filter.maxAmount}`);
      delegationConditions.push(
        `delegations.delegated_value <= ${filter.maxAmount}`,
      );
    }
    if (filter.from != null) {
      transferConditions.push(`transfers.from_account_id = '${filter.from}'`);
      delegationConditions.push(
        `delegations.delegator_account_id = '${filter.from}'`,
      );
    }
    if (filter.to != null) {
      transferConditions.push(`transfers.to_account_id = '${filter.to}'`);
      delegationConditions.push(
        `delegations.delegate_account_id = '${filter.to}'`,
      );
    }

    return {
      transfer: this.coalesceConditionArray(transferConditions),
      delegation: this.coalesceConditionArray(delegationConditions),
    };
  }

  private timePeriodToSql(filter: TransactionsRequest): string[] {
    const filterConditions: string[] = [];

    if (filter.fromDate)
      filterConditions.push(
        `delegations.timestamp >= ${BigInt(filter.fromDate)} OR transfers.timestamp >= ${BigInt(filter.fromDate)}`,
      );
    if (filter.toDate)
      filterConditions.push(
        `delegations.timestamp <= ${BigInt(filter.toDate)} OR transfers.timestamp <= ${BigInt(filter.toDate)}`,
      );

    return filterConditions;
  }

  private coalesceConditionArray(conditions: string[]): string {
    return conditions.length > 0 ? conditions.join(" AND ") : "true";
  }
}
