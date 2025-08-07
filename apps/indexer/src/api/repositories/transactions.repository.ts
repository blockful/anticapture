import { db } from "ponder:api";
import { transaction, transfer, delegation } from "ponder:schema";
import { eq, desc, asc, and, or, count, gte, lte } from "ponder";
import {
  TransactionMapper,
  TransactionsRequest,
  TransactionsResponse,
  AffectedSupply,
} from "../mappers/transactions";

type TransactionsResponseWithoutTotal = Omit<TransactionsResponse, "total">;

export class TransactionsRepository {
  async getTransactionsWithChildren(
    params: TransactionsRequest = {},
  ): Promise<TransactionsResponseWithoutTotal> {
    const {
      limit = 50,
      offset = 0,
      sortBy = "timestamp",
      sortOrder = "desc",
      from,
      to,
      minAmount,
      maxAmount,
      affectedSupply,
    } = params;

    // Parse affectedSupply array into individual filters
    const affectedSupplyFilters = this.parseAffectedSupply(affectedSupply);

    // Build where conditions
    const whereConditions = this.buildWhereConditions(
      from,
      to,
      affectedSupplyFilters,
    );

    // If amount filtering is needed, we need to use a more complex query
    if (minAmount !== undefined || maxAmount !== undefined) {
      // Build amount filtering conditions
      const amountConditions = [];

      // Handle transfers
      if (minAmount !== undefined && maxAmount !== undefined) {
        // Both min and max amount specified
        amountConditions.push(
          and(
            gte(transfer.amount, BigInt(minAmount)),
            lte(transfer.amount, BigInt(maxAmount)),
          ),
        );
        amountConditions.push(
          and(
            gte(delegation.delegatedValue, BigInt(minAmount)),
            lte(delegation.delegatedValue, BigInt(maxAmount)),
          ),
        );
      } else if (minAmount !== undefined) {
        // Only min amount specified
        amountConditions.push(and(gte(transfer.amount, BigInt(minAmount))));
        amountConditions.push(
          and(gte(delegation.delegatedValue, BigInt(minAmount))),
        );
      } else if (maxAmount !== undefined) {
        // Only max amount specified
        amountConditions.push(and(lte(transfer.amount, BigInt(maxAmount))));
        amountConditions.push(
          and(lte(delegation.delegatedValue, BigInt(maxAmount))),
        );
      }

      // Combine amount conditions with OR logic
      const amountFilterCondition =
        amountConditions.length > 0 ? or(...amountConditions) : undefined;

      // Combine all conditions
      const allConditions = [...whereConditions, amountFilterCondition].filter(
        Boolean,
      );

      // Get transactions with their transfers and delegations
      const transactionsWithData = await db
        .select({
          transaction: transaction,
          transfer: transfer,
          delegation: delegation,
        })
        .from(transaction)
        .leftJoin(
          transfer,
          eq(transaction.transactionHash, transfer.transactionHash),
        )
        .leftJoin(
          delegation,
          eq(transaction.transactionHash, delegation.transactionHash),
        )
        .where(allConditions.length > 0 ? and(...allConditions) : undefined)
        .orderBy(
          sortBy === "timestamp"
            ? sortOrder === "desc"
              ? desc(transaction.timestamp)
              : asc(transaction.timestamp)
            : desc(transaction.timestamp),
        )
        .limit(limit)
        .offset(offset);

      // Group the results by transaction
      const transactionMap = new Map<
        string,
        {
          transaction: typeof transaction.$inferSelect;
          transfers: (typeof transfer.$inferSelect)[];
          delegations: (typeof delegation.$inferSelect)[];
        }
      >();

      for (const row of transactionsWithData) {
        const hash = row.transaction.transactionHash;

        if (!transactionMap.has(hash)) {
          transactionMap.set(hash, {
            transaction: row.transaction,
            transfers: [],
            delegations: [],
          });
        }

        const entry = transactionMap.get(hash)!;

        if (row.transfer) {
          entry.transfers.push(row.transfer);
        }
        if (row.delegation) {
          entry.delegations.push(row.delegation);
        }
      }

      // Map to API response using the mapper
      const mappedTransactions = Array.from(transactionMap.values()).map(
        (entry) =>
          TransactionMapper.toApi(
            entry.transaction,
            entry.transfers,
            entry.delegations,
          ),
      );

      return {
        transactions: mappedTransactions,
      };
    }

    // If no amount filtering, use simple query with joins
    const transactionsWithData = await db
      .select({
        transaction: transaction,
        transfer: transfer,
        delegation: delegation,
      })
      .from(transaction)
      .leftJoin(
        transfer,
        eq(transaction.transactionHash, transfer.transactionHash),
      )
      .leftJoin(
        delegation,
        eq(transaction.transactionHash, delegation.transactionHash),
      )
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(
        sortBy === "timestamp"
          ? sortOrder === "desc"
            ? desc(transaction.timestamp)
            : asc(transaction.timestamp)
          : desc(transaction.timestamp),
      )
      .limit(limit)
      .offset(offset);

    // Group the results by transaction
    const transactionMap = new Map<
      string,
      {
        transaction: typeof transaction.$inferSelect;
        transfers: (typeof transfer.$inferSelect)[];
        delegations: (typeof delegation.$inferSelect)[];
      }
    >();

    for (const row of transactionsWithData) {
      const hash = row.transaction.transactionHash;

      if (!transactionMap.has(hash)) {
        transactionMap.set(hash, {
          transaction: row.transaction,
          transfers: [],
          delegations: [],
        });
      }

      const entry = transactionMap.get(hash)!;

      if (row.transfer) {
        entry.transfers.push(row.transfer);
      }
      if (row.delegation) {
        entry.delegations.push(row.delegation);
      }
    }

    // Map to API response using the mapper
    const mappedTransactions = Array.from(transactionMap.values()).map(
      (entry) =>
        TransactionMapper.toApi(
          entry.transaction,
          entry.transfers,
          entry.delegations,
        ),
    );

    return {
      transactions: mappedTransactions,
    };
  }

  async getTransactionCount(
    params: {
      from?: string;
      to?: string;
      minAmount?: number;
      maxAmount?: number;
      affectedSupply?: AffectedSupply[];
    } = {},
  ): Promise<number> {
    const { from, to, minAmount, maxAmount, affectedSupply } = params;

    // Parse affectedSupply array into individual filters
    const affectedSupplyFilters = this.parseAffectedSupply(affectedSupply);

    // Build where conditions using the shared method
    const whereConditions = this.buildWhereConditions(
      from,
      to,
      affectedSupplyFilters,
    );

    // If amount filtering is needed, we need to use a more complex query
    if (minAmount !== undefined || maxAmount !== undefined) {
      // Build amount filtering conditions
      const amountConditions = [];

      // Handle transfers
      if (minAmount !== undefined && maxAmount !== undefined) {
        amountConditions.push(
          and(
            gte(transfer.amount, BigInt(minAmount)),
            lte(transfer.amount, BigInt(maxAmount)),
          ),
        );
        amountConditions.push(
          and(
            gte(delegation.delegatedValue, BigInt(minAmount)),
            lte(delegation.delegatedValue, BigInt(maxAmount)),
          ),
        );
      } else if (minAmount !== undefined) {
        amountConditions.push(and(gte(transfer.amount, BigInt(minAmount))));
        amountConditions.push(
          and(gte(delegation.delegatedValue, BigInt(minAmount))),
        );
      } else if (maxAmount !== undefined) {
        amountConditions.push(and(lte(transfer.amount, BigInt(maxAmount))));
        amountConditions.push(
          and(lte(delegation.delegatedValue, BigInt(maxAmount))),
        );
      }

      // Combine amount conditions with OR logic
      const amountFilterCondition =
        amountConditions.length > 0 ? or(...amountConditions) : undefined;

      // Combine all conditions
      const allConditions = [...whereConditions, amountFilterCondition].filter(
        Boolean,
      );

      // Get distinct transaction hashes that match the criteria
      const result = await db
        .select({
          transactionHash: transaction.transactionHash,
        })
        .from(transaction)
        .leftJoin(
          transfer,
          eq(transaction.transactionHash, transfer.transactionHash),
        )
        .leftJoin(
          delegation,
          eq(transaction.transactionHash, delegation.transactionHash),
        )
        .where(allConditions.length > 0 ? and(...allConditions) : undefined);

      // Count distinct transaction hashes
      const distinctTransactionHashes = new Set(
        result.map((row) => row.transactionHash).filter(Boolean),
      );

      return distinctTransactionHashes.size;
    }

    // If no amount filtering, use efficient COUNT query
    const result = await db
      .select({
        count: count(),
      })
      .from(transaction)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

    return result[0]?.count || 0;
  }

  private parseAffectedSupply(affectedSupply: AffectedSupply[] | undefined): {
    isCex?: boolean;
    isDex?: boolean;
    isLending?: boolean;
    isTotal?: boolean;
  } {
    if (!affectedSupply || affectedSupply.length === 0) {
      return {};
    }

    const filters: {
      isCex?: boolean;
      isDex?: boolean;
      isLending?: boolean;
      isTotal?: boolean;
    } = {};

    if (affectedSupply.includes("CEX")) {
      filters.isCex = true;
    }
    if (affectedSupply.includes("DEX")) {
      filters.isDex = true;
    }
    if (affectedSupply.includes("LENDING")) {
      filters.isLending = true;
    }
    if (affectedSupply.includes("TOTAL")) {
      filters.isTotal = true;
    }

    return filters;
  }

  private buildWhereConditions(
    from: string | undefined,
    to: string | undefined,
    affectedSupplyFilters: {
      isCex?: boolean;
      isDex?: boolean;
      isLending?: boolean;
      isTotal?: boolean;
    },
  ) {
    const whereConditions = [];

    // Handle nested from filtering
    if (from) {
      const fromConditions = [
        eq(transaction.fromAddress, from),
        eq(transfer.fromAccountId, from),
        eq(delegation.delegatorAccountId, from),
      ];
      whereConditions.push(or(...fromConditions));
    }

    // Handle nested to filtering
    if (to) {
      const toConditions = [
        eq(transaction.toAddress, to),
        eq(transfer.toAccountId, to),
        eq(delegation.delegateAccountId, to),
      ];
      whereConditions.push(or(...toConditions));
    }

    // Apply affectedSupply filters - only check transaction table
    if (affectedSupplyFilters.isCex !== undefined) {
      whereConditions.push(eq(transaction.isCex, affectedSupplyFilters.isCex));
    }
    if (affectedSupplyFilters.isDex !== undefined) {
      whereConditions.push(eq(transaction.isDex, affectedSupplyFilters.isDex));
    }
    if (affectedSupplyFilters.isLending !== undefined) {
      whereConditions.push(
        eq(transaction.isLending, affectedSupplyFilters.isLending),
      );
    }
    if (affectedSupplyFilters.isTotal !== undefined) {
      whereConditions.push(
        eq(transaction.isTotal, affectedSupplyFilters.isTotal),
      );
    }

    return whereConditions;
  }
}
