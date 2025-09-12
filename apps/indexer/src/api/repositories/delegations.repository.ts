import { db } from "ponder:api";
import { delegation } from "ponder:schema";
import { asc, desc, gte, lte, sql, eq } from "ponder";
import { SQL } from "drizzle-orm";
import { TransactionsRequest } from "../mappers/transactions";

export type AffectedSupplyFilters = {
  isCex?: boolean;
  isDex?: boolean;
  isLending?: boolean;
  isTotal?: boolean;
};

export type DelegationsSortBy = "timestamp";
export type SortOrder = "asc" | "desc";

export type DelegationsFilterBy = {
  affectedSupply?: AffectedSupplyFilters;
  minAmount?: bigint;
  maxAmount?: bigint;
  from?: string;
  to?: string;
  limit: number;
  offset: number;
};

export class DelegationsRepository {
  async getDelegationsTransactionHashesWithTimestamp(
    filterBy: TransactionsRequest,
  ): Promise<{ timestamp: bigint; transactionHash: string }[]> {
    const { limit, offset, sortBy, sortOrder } = filterBy;

    const where = this.buildWhere(filterBy);

    const order =
      sortBy === "timestamp"
        ? sortOrder === "asc"
          ? asc(delegation.timestamp)
          : desc(delegation.timestamp)
        : desc(delegation.timestamp);

    return db
      .selectDistinctOn([delegation.timestamp, delegation.transactionHash], {
        transactionHash: delegation.transactionHash,
        timestamp: delegation.timestamp,
      })
      .from(delegation)
      .where(where)
      .orderBy(order, desc(delegation.timestamp))
      .limit(limit)
      .offset(offset);
  }

  private buildWhere(
    filterBy:
      | Omit<DelegationsFilterBy, "limit" | "offset">
      | DelegationsFilterBy,
  ): SQL<unknown> {
    const parts: SQL<unknown>[] = [];

    if (filterBy.from) {
      parts.push(eq(delegation.delegatorAccountId, filterBy.from));
    }
    if (filterBy.to) {
      parts.push(eq(delegation.delegateAccountId, filterBy.to));
    }

    const supplyConds: SQL<unknown>[] = [];
    if (filterBy.affectedSupply?.isCex === true) {
      supplyConds.push(sql`"is_cex" = TRUE`);
    }
    if (filterBy.affectedSupply?.isDex === true) {
      supplyConds.push(sql`"is_dex" = TRUE`);
    }
    if (filterBy.affectedSupply?.isLending === true) {
      supplyConds.push(sql`"is_lending" = TRUE`);
    }
    if (filterBy.affectedSupply?.isTotal === true) {
      supplyConds.push(sql`"is_total" = TRUE`);
    }
    if (supplyConds.length > 0) {
      const supplyOr = supplyConds.reduce(
        (acc, p, i) => (i === 0 ? sql`${p}` : sql`${acc} OR ${p}`),
        sql`` as SQL<unknown>,
      );
      parts.push(sql`(${supplyOr})`);
    }

    if (filterBy.minAmount !== undefined) {
      parts.push(gte(delegation.delegatedValue, filterBy.minAmount));
    }
    if (filterBy.maxAmount !== undefined) {
      parts.push(lte(delegation.delegatedValue, filterBy.maxAmount));
    }

    if (parts.length === 0) return sql`TRUE`;
    return parts.reduce(
      (acc, p, i) => (i === 0 ? sql`${p}` : sql`${acc} AND ${p}`),
      sql`` as SQL<unknown>,
    );
  }
}
