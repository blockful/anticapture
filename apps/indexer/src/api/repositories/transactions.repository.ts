import { db } from "ponder:api";
import { transaction } from "ponder:schema";
import { sql, inArray } from "ponder";
import { SQL } from "drizzle-orm";
import { TransactionsRequest } from "../mappers/transactions";

export class TransactionsRepository {
  async getTransactionsByHashesOnly(hashes: string[], limit: number) {
    if (hashes.length === 0) return [];
    return db.query.transaction.findMany({
      where: inArray(transaction.transactionHash, hashes),
      limit,
      with: {
        transfers: true,
        delegations: true,
      },
    });
  }

  async getTransactionsCount(filters: TransactionsRequest): Promise<number> {
    const whereClause = this.buildExistsWhereClause(filters);
    const countQuery = sql`
      SELECT COUNT(*)::bigint AS total
      FROM "transaction" t
      WHERE ${whereClause}
    `;
    const result = await db.execute(countQuery);
    return Number(result.rows[0]?.total ?? 0);
  }

  private buildExistsWhereClause(filters: TransactionsRequest): SQL<unknown> {
    // Transaction-level conditions (AND-ed inside this branch)
    const txConds: SQL<unknown>[] = [];
    if (filters.from) txConds.push(sql`t."from_address" = ${filters.from}`);
    if (filters.to) txConds.push(sql`t."to_address" = ${filters.to}`);
    // OR across selected supply flags
    const supplyTx: SQL<unknown>[] = [];
    if (filters.affectedSupply?.isCex === true)
      supplyTx.push(sql`t."is_cex" = TRUE`);
    if (filters.affectedSupply?.isDex === true)
      supplyTx.push(sql`t."is_dex" = TRUE`);
    if (filters.affectedSupply?.isLending === true)
      supplyTx.push(sql`t."is_lending" = TRUE`);
    if (filters.affectedSupply?.isTotal === true)
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
