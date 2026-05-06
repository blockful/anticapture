import { sql, eq, or, countDistinct, SQLChunk } from "drizzle-orm";

import { Drizzle, delegation, transfer } from "@/database";
import { DBTransaction, TransactionsRequest } from "@/mappers";

export class TransactionsRepository {
  constructor(private readonly db: Drizzle) {}

  async getFilteredAggregateTransactions(
    filter: TransactionsRequest,
  ): Promise<DBTransaction[]> {
    const hashQuery = this.resolveTransactionHashQuery(filter);
    const orderDirection = sql.raw(filter.orderDirection ?? "desc");
    const query = sql`
    WITH filtered_transactions AS (${hashQuery}),
    event_rollup AS (
        SELECT
          events.transaction_hash,
          (ARRAY_AGG(events.from_address ORDER BY events.kind_priority, events.log_index ASC))[1] AS from_address,
          (ARRAY_AGG(events.to_address   ORDER BY events.kind_priority, events.log_index ASC))[1] AS to_address,
          BOOL_OR(events.is_cex)     AS is_cex,
          BOOL_OR(events.is_dex)     AS is_dex,
          BOOL_OR(events.is_lending) AS is_lending,
          BOOL_OR(events.is_total)   AS is_total,
          MIN(events.timestamp)      AS timestamp
        FROM (
          SELECT
            ${transfer.transactionHash} AS transaction_hash,
            ${transfer.fromAccountId}   AS from_address,
            ${transfer.toAccountId}     AS to_address,
            ${transfer.isCex}           AS is_cex,
            ${transfer.isDex}           AS is_dex,
            ${transfer.isLending}       AS is_lending,
            ${transfer.isTotal}         AS is_total,
            ${transfer.timestamp}       AS timestamp,
            ${transfer.logIndex}        AS log_index,
            0                           AS kind_priority
          FROM ${transfer}
          WHERE ${transfer.transactionHash} IN (SELECT transaction_hash FROM filtered_transactions)
          UNION ALL
          SELECT
            ${delegation.transactionHash}      AS transaction_hash,
            ${delegation.delegatorAccountId}   AS from_address,
            ${delegation.delegateAccountId}    AS to_address,
            ${delegation.isCex}                AS is_cex,
            ${delegation.isDex}                AS is_dex,
            ${delegation.isLending}            AS is_lending,
            ${delegation.isTotal}              AS is_total,
            ${delegation.timestamp}            AS timestamp,
            ${delegation.logIndex}             AS log_index,
            1                                  AS kind_priority
          FROM ${delegation}
          WHERE ${delegation.transactionHash} IN (SELECT transaction_hash FROM filtered_transactions)
        ) events
        GROUP BY events.transaction_hash
    ),
    paginated_transactions AS (
        SELECT *
        FROM event_rollup
        ORDER BY timestamp ${orderDirection}
        LIMIT ${filter.limit}
        OFFSET ${filter.skip ?? 0}
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
        WHERE ${transfer.transactionHash} IN (SELECT transaction_hash FROM paginated_transactions)
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
        WHERE ${delegation.transactionHash} IN (SELECT transaction_hash FROM paginated_transactions)
        GROUP BY ${delegation.transactionHash}
    )
    SELECT
      pt.transaction_hash AS "transactionHash",
      pt.from_address AS "fromAddress",
      pt.to_address AS "toAddress",
      pt.is_cex AS "isCex",
      pt.is_dex AS "isDex",
      pt.is_lending AS "isLending",
      pt.is_total AS "isTotal",
      pt.timestamp,
      COALESCE(ta.transfers, '[]'::json) as transfers,
      COALESCE(da.delegations, '[]'::json) as delegations
    FROM paginated_transactions pt
    LEFT JOIN transfer_aggregates ta ON ta.transaction_hash = pt.transaction_hash
    LEFT JOIN delegation_aggregates da ON da.transaction_hash = pt.transaction_hash
    ORDER BY pt.timestamp ${orderDirection};
`;
    const result = await this.db.execute<DBTransaction>(query);

    return result.rows;
  }

  async getAggregatedTransactionsCount(
    filter: TransactionsRequest,
  ): Promise<number> {
    const { transfer: transferFilter, delegation: delegationFilter } =
      this.filterToSql(filter);

    const query = await this.db
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

    const transferSupplyConditions: string[] = [];
    const delegationSupplyConditions: string[] = [];
    const transferAmountConditions: string[] = [];
    const delegationAmountConditions: string[] = [];
    const transferOtherConditions: string[] = [];
    const delegationOtherConditions: string[] = [];

    const checkIsDex = filter.affectedSupply.isDex ?? false;
    const checkIsCex = filter.affectedSupply.isCex ?? false;
    const checkIsLending = filter.affectedSupply.isLending ?? false;
    const checkIsTotal = filter.affectedSupply.isTotal ?? false;
    const checkIsUnassigned = filter.affectedSupply.isUnassigned ?? false;

    if (checkIsDex) {
      transferSupplyConditions.push(`transfers.is_dex = true`);
      delegationSupplyConditions.push(`delegations.is_dex = true`);
    }
    if (checkIsCex) {
      transferSupplyConditions.push(`transfers.is_cex = true`);
      delegationSupplyConditions.push(`delegations.is_cex = true`);
    }
    if (checkIsLending) {
      transferSupplyConditions.push(`transfers.is_lending = true`);
      delegationSupplyConditions.push(`delegations.is_lending = true`);
    }
    if (checkIsTotal) {
      transferSupplyConditions.push(`transfers.is_total = true`);
      delegationSupplyConditions.push(`delegations.is_total = true`);
    }
    if (checkIsUnassigned) {
      transferSupplyConditions.push(
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
      delegationSupplyConditions.push(
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
      transferAmountConditions.push(`transfers.amount >= ${filter.minAmount}`);
      delegationAmountConditions.push(
        `delegations.delegated_value >= ${filter.minAmount}`,
      );
    }
    if (filter.maxAmount != null) {
      transferAmountConditions.push(`transfers.amount <= ${filter.maxAmount}`);
      delegationAmountConditions.push(
        `delegations.delegated_value <= ${filter.maxAmount}`,
      );
    }
    if (filter.from != null) {
      transferOtherConditions.push(
        `transfers.from_account_id = '${filter.from}'`,
      );
      delegationOtherConditions.push(
        `delegations.delegator_account_id = '${filter.from}'`,
      );
    }
    if (filter.to != null) {
      transferOtherConditions.push(`transfers.to_account_id = '${filter.to}'`);
      delegationOtherConditions.push(
        `delegations.delegate_account_id = '${filter.to}'`,
      );
    }

    const transferSupplyBlock =
      transferSupplyConditions.length > 0
        ? this.coalesceConditionArray(transferSupplyConditions, "OR")
        : "true";
    const delegationSupplyBlock =
      delegationSupplyConditions.length > 0
        ? this.coalesceConditionArray(delegationSupplyConditions, "OR")
        : "true";

    const transferAmountBlock =
      transferAmountConditions.length > 0
        ? this.coalesceConditionArray(transferAmountConditions, "AND")
        : "true";
    const delegationAmountBlock =
      delegationAmountConditions.length > 0
        ? this.coalesceConditionArray(delegationAmountConditions, "AND")
        : "true";

    const transferOtherBlock =
      transferOtherConditions.length > 0
        ? this.coalesceConditionArray(transferOtherConditions, "AND")
        : "true";
    const delegationOtherBlock =
      delegationOtherConditions.length > 0
        ? this.coalesceConditionArray(delegationOtherConditions, "AND")
        : "true";

    return {
      transfer: this.coalesceConditionArray(
        [
          transferTimePeriodConditions,
          `(${transferSupplyBlock} AND ${transferAmountBlock} AND ${transferOtherBlock})`,
        ],
        "AND",
      ),
      delegation: this.coalesceConditionArray(
        [
          delegationTimePeriodConditions,
          `(${delegationSupplyBlock} AND ${delegationAmountBlock} AND ${delegationOtherBlock})`,
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
      filterConditions.push(`${tsCol} >= ${BigInt(filter.fromDate)}`);
    if (filter.toDate)
      filterConditions.push(`${tsCol} <= ${BigInt(filter.toDate)}`);

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

    const transferChunk = sql`
        SELECT DISTINCT ${transfer.transactionHash}
        FROM ${transfer}
        WHERE ${sql.raw(transferFilter)}`;
    const delegationChunk = sql`
        SELECT DISTINCT ${delegation.transactionHash}
        FROM ${delegation}
        WHERE ${sql.raw(delegationFilter)}`;

    if (transfers && delegations) {
      return sql`${transferChunk} UNION ${delegationChunk}`;
    } else if (transfers) {
      return transferChunk;
    } else {
      return delegationChunk;
    }
  }
}
