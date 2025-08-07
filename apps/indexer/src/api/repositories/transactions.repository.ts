import { db } from "ponder:api";
import { transaction, transfer, delegation } from "ponder:schema";
import { eq, desc, asc, and, or, gte, lte } from "ponder";

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
}
