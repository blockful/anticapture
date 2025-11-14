import { DBTransaction, TransactionsRequest } from "../mappers";
import { sql, eq, or, countDistinct, SQLChunk } from "drizzle-orm";
import { db } from "ponder:api";
import { delegation, transaction, transfer } from "ponder:schema";

export class TransactionsRepository {
  async getFilteredAggregateTransactions(
    filter: TransactionsRequest,
  ): Promise<DBTransaction[]> {
    const hashQuery = this.resolveTransactionHashQuery(filter);
    const query = sql`
    WITH filtered_transactions AS (${hashQuery}),
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

  async getAggregatedTransactionsCount(
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

  private filterToSql(filter: TransactionsRequest): {
    transfer: string;
    delegation: string;
  } {
    const transferTimePeriodConditions: string = this.coalesceConditionArray(
      this.timePeriodToSql(filter, "transfers"),
      "AND",
    );
    const delegationTimePeriodConditions: string = this.coalesceConditionArray(
      this.timePeriodToSql(filter, "delegations"),
      "AND",
    );
    const checkIsDex = filter.affectedSupply.isDex ?? false;
    const checkIsCex = filter.affectedSupply.isCex ?? false;
    const checkIsLending = filter.affectedSupply.isLending ?? false;
    const checkIsTotal = filter.affectedSupply.isTotal ?? false;
    const checkIsUnassigned = filter.affectedSupply.isUnassigned ?? false;

    const transferConditions: string[] = [];
    const delegationConditions: string[] = [];

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
    if (checkIsUnassigned) {
      transferConditions.push(
        this.coalesceConditionArray(
          [
            `transfers.is_total = false`,
            `transfers.is_cex = false`,
            `transfers.is_dex = false`,
            `transfers.is_lending = false`,
          ],
          "AND",
        ),
      );
      delegationConditions.push(
        this.coalesceConditionArray(
          [
            `delegations.is_total = false`,
            `delegations.is_cex = false`,
            `delegations.is_dex = false`,
            `delegations.is_lending = false`,
          ],
          "AND",
        ),
      );
    }

    if (filter.minAmount != null) {
      transferConditions.push(`transfers.amount >= ${filter.minAmount} `);
      delegationConditions.push(
        `delegations.delegated_value >= ${filter.minAmount} `,
      );
    }
    if (filter.maxAmount != null) {
      transferConditions.push(`transfers.amount <= ${filter.maxAmount} `);
      delegationConditions.push(
        `delegations.delegated_value <= ${filter.maxAmount} `,
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
      transfer: this.coalesceConditionArray(
        [
          transferTimePeriodConditions,
          this.coalesceConditionArray(transferConditions, "OR"),
        ],
        "AND",
      ),
      delegation: this.coalesceConditionArray(
        [
          delegationTimePeriodConditions,
          this.coalesceConditionArray(delegationConditions, "OR"),
        ],
        "AND",
      ),
    };
  }

  private timePeriodToSql(
    filter: TransactionsRequest,
    tableAlias?: string,
  ): string[] {
    const filterConditions: string[] = [];
    const tsCol = tableAlias ? `${tableAlias}.timestamp` : "timestamp";

    if (filter.fromDate)
      filterConditions.push(`${tsCol} >= ${BigInt(filter.fromDate)} `);
    if (filter.toDate)
      filterConditions.push(`${tsCol} <= ${BigInt(filter.toDate)} `);

    return filterConditions;
  }

  private coalesceConditionArray(
    conditions: string[],
    operator: "AND" | "OR",
  ): string {
    const separator = ` ${operator} `;
    return conditions.length > 0 ? `(${conditions.join(separator)})` : "true";
  }

  private resolveTransactionHashQuery(filter: TransactionsRequest): SQLChunk {
    const { transfer: transferFilter, delegation: delegationFilter } =
      this.filterToSql(filter);
    const { transfers, delegations } = filter.includes;
    console.log({ filter: filter, sql: this.filterToSql(filter) });

    const transferChunk = sql`
        SELECT DISTINCT ${transfer.transactionHash}
        FROM ${transfer}
        WHERE ${sql.raw(transferFilter)} `;
    const delegationChunk = sql`
        SELECT DISTINCT ${delegation.transactionHash}
        FROM ${delegation}
        WHERE ${sql.raw(delegationFilter)} `;

    if (transfers && delegations) {
      return sql`${transferChunk} UNION ${delegationChunk} `;
    } else if (transfers) {
      return transferChunk;
    } else {
      return delegationChunk;
    }
  }
}
