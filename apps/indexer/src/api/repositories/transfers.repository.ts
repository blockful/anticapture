import { db } from "ponder:api";
import { transfer } from "ponder:schema";
import { asc, count, desc, gte, lte, sql, or, eq } from "ponder";
import { SQL } from "drizzle-orm";

export type AffectedSupplyFilters = {
  isCex?: boolean;
  isDex?: boolean;
  isLending?: boolean;
  isTotal?: boolean;
};

export type TransfersSortBy = "timestamp";
export type SortOrder = "asc" | "desc";

export type TransfersFilterBy = {
  affectedSupply?: AffectedSupplyFilters;
  minAmount?: bigint;
  maxAmount?: bigint;
  from?: string;
  to?: string;
  limit: number;
  offset: number;
};

export class TransfersRepository {
  private clampLimit(limit: number): number {
    const max = 100;
    if (!Number.isFinite(limit) || limit <= 0) return 10;
    return Math.min(limit, max);
  }

  async getTransfers(
    sortBy: TransfersSortBy,
    sortOrder: SortOrder,
    filterBy: TransfersFilterBy,
  ): Promise<(typeof transfer.$inferSelect)[]> {
    const limit = this.clampLimit(filterBy.limit);
    const offset = Math.max(0, filterBy.offset ?? 0);

    const where = this.buildWhere(filterBy);

    const order =
      sortBy === "timestamp"
        ? sortOrder === "asc"
          ? asc(transfer.timestamp)
          : desc(transfer.timestamp)
        : desc(transfer.timestamp);

    return db
      .selectDistinctOn([transfer.timestamp, transfer.transactionHash])
      .from(transfer)
      .where(where)
      .orderBy(order, desc(transfer.transactionHash))
      .limit(limit)
      .offset(offset);
  }

  async getTransfersByHash(hashes: string[]) {
    if (hashes.length === 0) return [];
    return db
      .select()
      .from(transfer)
      .where(or(...hashes.map((h) => eq(transfer.transactionHash, h))));
  }

  async getTransfersCount(
    filterBy: Omit<TransfersFilterBy, "limit" | "offset">,
  ): Promise<number> {
    const where = this.buildWhere(filterBy);
    const result = await db.select({ c: count() }).from(transfer).where(where);
    const row = result[0];
    // count() returns bigint in postgres; here Drizzle coerces to number | string, normalize to number
    const value = (row as unknown as { c: number | string }).c;
    return typeof value === "string" ? Number(value) : value;
  }

  private buildWhere(
    filterBy: Omit<TransfersFilterBy, "limit" | "offset"> | TransfersFilterBy,
  ): SQL<unknown> {
    const parts: SQL<unknown>[] = [];

    if (filterBy.from) {
      parts.push(eq(transfer.fromAccountId, filterBy.from));
    }
    if (filterBy.to) {
      parts.push(eq(transfer.toAccountId, filterBy.to));
    }
    console.log("affectedSupply", filterBy.affectedSupply);
    // affected supply flags live on transfer rows - OR semantics across selected flags
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
      parts.push(gte(transfer.amount, filterBy.minAmount));
    }
    if (filterBy.maxAmount !== undefined) {
      parts.push(lte(transfer.amount, filterBy.maxAmount));
    }

    if (parts.length === 0) return sql`TRUE`;
    return parts.reduce(
      (acc, p, i) => (i === 0 ? sql`${p}` : sql`${acc} AND ${p}`),
      sql`` as SQL<unknown>,
    );
  }
}
