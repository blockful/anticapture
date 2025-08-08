import { db } from "ponder:api";
import { transaction, transfer, delegation } from "ponder:schema";
import { eq, desc, asc, and, or, gte, lte, sql } from "ponder";
import { SQL } from "drizzle-orm";

export type AffectedSupplyFilters = {
  isCex?: boolean;
  isDex?: boolean;
  isLending?: boolean;
  isTotal?: boolean;
};

export type TransactionFilters = {
  from?: string;
  to?: string;
  affectedSupplyFilters: AffectedSupplyFilters;
};

export type TransferFilters = {
  from?: string;
  to?: string;
  minAmount?: number;
  maxAmount?: number;
};

export type DelegationFilters = {
  from?: string;
  to?: string;
  minAmount?: number;
  maxAmount?: number;
};

export class TransactionsRepository {
  // Simple data access methods - no business logic

  async getAllTransactionHashes(): Promise<string[]> {
    const result = await db
      .select({ transactionHash: transaction.transactionHash })
      .from(transaction);

    return result.map((t) => t.transactionHash);
  }

  /**
   * Efficient paginated transaction search using EXISTS subqueries.
   * Applies the rule: a transaction qualifies if ANY of the following match:
   * - transaction-level filters (from/to/affectedSupply)
   * - transfer-level filters (from/to/minAmount/maxAmount)
   * - delegation-level filters (from/to/minAmount/maxAmount)
   */
  async getPaginatedTransactionsByFilters(
    filters: TransactionFilters & TransferFilters & DelegationFilters,
    pagination: { limit: number; offset: number },
    sorting: { sortBy: string; sortOrder: string },
  ): Promise<{ items: (typeof transaction.$inferSelect)[]; total: number }> {
    const whereClause = this.buildExistsWhereClause(filters);

    const orderDir = sorting.sortOrder === "asc" ? sql`ASC` : sql`DESC`;

    const selectQuery = sql`
      SELECT t.*
      FROM "transaction" t
      WHERE ${whereClause}
      ORDER BY t."timestamp" ${orderDir}
      LIMIT ${pagination.limit}
      OFFSET ${pagination.offset}
    `;

    const countQuery = sql`
      SELECT COUNT(*)::bigint AS total
      FROM "transaction" t
      WHERE ${whereClause}
    `;

    const [rowsResult, countResult] = await Promise.all([
      db.execute(selectQuery),
      db.execute<{ total: string }>(countQuery),
    ]);

    const total = Number(countResult.rows[0]?.total ?? 0);
    const items = (rowsResult.rows as unknown as Record<string, unknown>[]).map(
      (r) => r as unknown as typeof transaction.$inferSelect,
    );
    return { items, total };
  }

  async getTransactionsByHashes(
    hashes: string[],
    pagination: { limit: number; offset: number },
    sorting: { sortBy: string; sortOrder: string },
  ) {
    if (hashes.length === 0) return [];

    const orderBy = this.buildOrderBy(sorting.sortBy, sorting.sortOrder);
    const hashConditions = hashes.map((hash) =>
      eq(transaction.transactionHash, hash),
    );

    return db
      .select()
      .from(transaction)
      .where(or(...hashConditions))
      .orderBy(orderBy)
      .limit(pagination.limit)
      .offset(pagination.offset);
  }

  async getTransfersForTransactions(hashes: string[]) {
    if (hashes.length === 0) return [];

    return db
      .select()
      .from(transfer)
      .where(or(...hashes.map((hash) => eq(transfer.transactionHash, hash))));
  }

  async getDelegationsForTransactions(hashes: string[]) {
    if (hashes.length === 0) return [];

    return db
      .select()
      .from(delegation)
      .where(or(...hashes.map((hash) => eq(delegation.transactionHash, hash))));
  }

  async getTransactionsByHashesOnly(hashes: string[]) {
    if (hashes.length === 0) return [];
    return db
      .select()
      .from(transaction)
      .where(
        or(...hashes.map((hash) => eq(transaction.transactionHash, hash))),
      );
  }

  async getTransactionsCount(
    filters: TransactionFilters & TransferFilters & DelegationFilters,
  ): Promise<number> {
    const whereClause = this.buildExistsWhereClause(filters);
    const countQuery = sql`
      SELECT COUNT(*)::bigint AS total
      FROM "transaction" t
      WHERE ${whereClause}
    `;
    const res = await db.execute<{ total: string }>(countQuery);
    return Number(res.rows[0]?.total ?? 0);
  }

  async findTransactionsByFilters(
    filters: TransactionFilters,
  ): Promise<string[]> {
    const conditions = [];

    if (filters.from)
      conditions.push(eq(transaction.fromAddress, filters.from));
    if (filters.to) conditions.push(eq(transaction.toAddress, filters.to));

    const { affectedSupplyFilters } = filters;
    if (affectedSupplyFilters.isCex !== undefined) {
      conditions.push(eq(transaction.isCex, affectedSupplyFilters.isCex));
    }
    if (affectedSupplyFilters.isDex !== undefined) {
      conditions.push(eq(transaction.isDex, affectedSupplyFilters.isDex));
    }
    if (affectedSupplyFilters.isLending !== undefined) {
      conditions.push(
        eq(transaction.isLending, affectedSupplyFilters.isLending),
      );
    }
    if (affectedSupplyFilters.isTotal !== undefined) {
      conditions.push(eq(transaction.isTotal, affectedSupplyFilters.isTotal));
    }

    if (conditions.length === 0) return [];

    const result = await db
      .select({ transactionHash: transaction.transactionHash })
      .from(transaction)
      .where(and(...conditions));

    return result.map((t) => t.transactionHash);
  }

  async findTransactionsByTransferFilters(
    filters: TransferFilters,
  ): Promise<string[]> {
    const conditions = [];

    if (filters.from) conditions.push(eq(transfer.fromAccountId, filters.from));
    if (filters.to) conditions.push(eq(transfer.toAccountId, filters.to));

    const amountCondition = this.buildAmountCondition(
      transfer.amount,
      filters.minAmount,
      filters.maxAmount,
    );
    if (amountCondition) conditions.push(amountCondition);

    if (conditions.length === 0) return [];

    const result = await db
      .select({ transactionHash: transfer.transactionHash })
      .from(transfer)
      .where(and(...conditions));

    return result
      .map((t) => t.transactionHash)
      .filter((hash): hash is string => Boolean(hash));
  }

  async findTransactionsByDelegationFilters(
    filters: DelegationFilters,
  ): Promise<string[]> {
    const conditions = [];

    if (filters.from)
      conditions.push(eq(delegation.delegatorAccountId, filters.from));
    if (filters.to)
      conditions.push(eq(delegation.delegateAccountId, filters.to));

    const amountCondition = this.buildAmountCondition(
      delegation.delegatedValue,
      filters.minAmount,
      filters.maxAmount,
    );
    if (amountCondition) conditions.push(amountCondition);

    if (conditions.length === 0) return [];

    const result = await db
      .select({ transactionHash: delegation.transactionHash })
      .from(delegation)
      .where(and(...conditions));

    return result
      .map((d) => d.transactionHash)
      .filter((hash): hash is string => Boolean(hash));
  }

  // Helper methods for data access only
  private buildAmountCondition(
    field: typeof transfer.amount | typeof delegation.delegatedValue,
    minAmount?: number,
    maxAmount?: number,
  ) {
    if (minAmount !== undefined && maxAmount !== undefined) {
      return and(gte(field, BigInt(minAmount)), lte(field, BigInt(maxAmount)));
    }
    if (minAmount !== undefined) {
      return gte(field, BigInt(minAmount));
    }
    if (maxAmount !== undefined) {
      return lte(field, BigInt(maxAmount));
    }
    return null;
  }

  private buildOrderBy(sortBy: string, sortOrder: string) {
    if (sortBy === "timestamp") {
      return sortOrder === "desc"
        ? desc(transaction.timestamp)
        : asc(transaction.timestamp);
    }
    return desc(transaction.timestamp);
  }

  /**
   * Build a SQL WHERE clause that enforces the ANY-match rule using EXISTS.
   * Returns a SQL fragment to be embedded in a raw query.
   */
  private buildExistsWhereClause(
    filters: TransactionFilters & TransferFilters & DelegationFilters,
  ): SQL<unknown> {
    // Transaction-level conditions (AND-ed inside this branch)
    const txConds: SQL<unknown>[] = [];
    if (filters.from) txConds.push(sql`t."from_address" = ${filters.from}`);
    if (filters.to) txConds.push(sql`t."to_address" = ${filters.to}`);
    // OR across selected supply flags
    const supplyTx: SQL<unknown>[] = [];
    if (filters.affectedSupplyFilters?.isCex === true)
      supplyTx.push(sql`t."is_cex" = TRUE`);
    if (filters.affectedSupplyFilters?.isDex === true)
      supplyTx.push(sql`t."is_dex" = TRUE`);
    if (filters.affectedSupplyFilters?.isLending === true)
      supplyTx.push(sql`t."is_lending" = TRUE`);
    if (filters.affectedSupplyFilters?.isTotal === true)
      supplyTx.push(sql`t."is_total" = TRUE`);
    if (supplyTx.length > 0) {
      const supplyOr = supplyTx.reduce(
        (acc, p, i) => (i === 0 ? sql`${p}` : sql`${acc} OR ${p}`),
        sql`` as SQL<unknown>,
      );
      txConds.push(sql`(${supplyOr})`);
    }

    const txClause = txConds.length
      ? txConds.reduce(
          (acc, part, i) => (i === 0 ? sql`${part}` : sql`${acc} AND ${part}`),
          sql`` as SQL<unknown>,
        )
      : undefined;
    const txBranch = txClause ? sql`(${txClause})` : undefined;

    // Transfer-level conditions
    const trConds: SQL<unknown>[] = [];
    if (filters.from) trConds.push(sql`tr."from_account_id" = ${filters.from}`);
    if (filters.to) trConds.push(sql`tr."to_account_id" = ${filters.to}`);
    if (filters.minAmount !== undefined && filters.maxAmount !== undefined)
      trConds.push(
        sql`tr."amount" >= ${BigInt(filters.minAmount)} AND tr."amount" <= ${BigInt(
          filters.maxAmount,
        )}`,
      );
    else if (filters.minAmount !== undefined)
      trConds.push(sql`tr."amount" >= ${BigInt(filters.minAmount)}`);
    else if (filters.maxAmount !== undefined)
      trConds.push(sql`tr."amount" <= ${BigInt(filters.maxAmount)}`);

    const trWhere = trConds.length
      ? trConds.reduce(
          (acc, part, i) => (i === 0 ? sql`${part}` : sql`${acc} AND ${part}`),
          sql`` as SQL<unknown>,
        )
      : undefined;
    const trExists = trWhere
      ? sql`EXISTS (SELECT 1 FROM "transfers" tr WHERE tr."transaction_hash" = t."transaction_hash" AND ${trWhere})`
      : undefined;

    // Delegation-level conditions
    const dgConds: SQL<unknown>[] = [];
    if (filters.from)
      dgConds.push(sql`dg."delegator_account_id" = ${filters.from}`);
    if (filters.to) dgConds.push(sql`dg."delegate_account_id" = ${filters.to}`);
    if (filters.minAmount !== undefined && filters.maxAmount !== undefined)
      dgConds.push(
        sql`dg."delegated_value" >= ${BigInt(
          filters.minAmount,
        )} AND dg."delegated_value" <= ${BigInt(filters.maxAmount)}`,
      );
    else if (filters.minAmount !== undefined)
      dgConds.push(sql`dg."delegated_value" >= ${BigInt(filters.minAmount)}`);
    else if (filters.maxAmount !== undefined)
      dgConds.push(sql`dg."delegated_value" <= ${BigInt(filters.maxAmount)}`);

    const dgWhere = dgConds.length
      ? dgConds.reduce(
          (acc, part, i) => (i === 0 ? sql`${part}` : sql`${acc} AND ${part}`),
          sql`` as SQL<unknown>,
        )
      : undefined;
    const dgExists = dgWhere
      ? sql`EXISTS (SELECT 1 FROM "delegations" dg WHERE dg."transaction_hash" = t."transaction_hash" AND ${dgWhere})`
      : undefined;

    // Combine branches with OR (ANY match)
    const branches = [txBranch, trExists, dgExists].filter(
      (b): b is SQL<unknown> => Boolean(b),
    );

    if (branches.length === 0) {
      // No filters: allow all
      return sql`TRUE`;
    }

    const whereOr = branches.reduce(
      (acc, part, i) => (i === 0 ? sql`${part}` : sql`${acc} OR ${part}`),
      sql`` as SQL<unknown>,
    );
    return whereOr;
  }
}
