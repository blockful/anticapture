import { db } from "ponder:api";
import { transaction, transfer, delegation } from "ponder:schema";
import { eq, desc, asc, and, or, isNotNull, count } from "ponder";
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
      minVolume,
      maxVolume,
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

    // If volume filtering is needed, we need to calculate total volume per transaction
    if (minVolume !== undefined || maxVolume !== undefined) {
      // Get all transactions with their transfers and delegations first
      const allTransactionsWithData = await db
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
        );

      // Group the results by transaction
      const transactionMap = new Map<
        string,
        {
          transaction: typeof transaction.$inferSelect;
          transfers: (typeof transfer.$inferSelect)[];
          delegations: (typeof delegation.$inferSelect)[];
        }
      >();

      for (const row of allTransactionsWithData) {
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

      // Filter transactions by their total volume
      const filteredTransactions = Array.from(transactionMap.values()).filter(
        (entry) => {
          // Calculate volume (same logic as in mapper)
          let volume = 0n;
          if (entry.transfers.length > 0) {
            volume = entry.transfers.reduce(
              (sum, transfer) => sum + (transfer.amount || 0n),
              0n,
            );
          } else if (entry.delegations.length > 0) {
            volume = entry.delegations.reduce((sum, delegation) => {
              const delegatedValue = delegation.delegatedValue || 0n;
              // Only add positive values (ignore negative or zero)
              return delegatedValue > 0n ? sum + delegatedValue : sum;
            }, 0n);
          }

          // Apply volume filters
          if (minVolume !== undefined && volume <= BigInt(minVolume)) {
            return false;
          }
          if (maxVolume !== undefined && volume >= BigInt(maxVolume)) {
            return false;
          }
          return true;
        },
      );

      // Apply pagination to filtered results
      const paginatedTransactions = filteredTransactions.slice(
        offset,
        offset + limit,
      );

      // Map to API response using the mapper
      const mappedTransactions = paginatedTransactions.map((entry) =>
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

    // If no volume filtering, use simple query with joins
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
      minVolume?: number;
      maxVolume?: number;
      affectedSupply?: AffectedSupply[];
    } = {},
  ): Promise<number> {
    const { from, to, minVolume, maxVolume, affectedSupply } = params;

    // Parse affectedSupply array into individual filters
    const affectedSupplyFilters = this.parseAffectedSupply(affectedSupply);

    // Build where conditions using the shared method
    const whereConditions = this.buildWhereConditions(
      from,
      to,
      affectedSupplyFilters,
    );

    // If volume filtering is needed, we need to calculate total volume per transaction
    if (minVolume !== undefined || maxVolume !== undefined) {
      // For volume filtering, we still need to get all transactions to calculate volume
      // This is because volume is calculated from transfers/delegations, not stored directly
      const allTransactionsWithData = await db
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
        .where(
          whereConditions.length > 0 ? and(...whereConditions) : undefined,
        );

      // Group the results by transaction
      const transactionMap = new Map<
        string,
        {
          transaction: typeof transaction.$inferSelect;
          transfers: (typeof transfer.$inferSelect)[];
          delegations: (typeof delegation.$inferSelect)[];
        }
      >();

      for (const row of allTransactionsWithData) {
        const hash = row.transaction.transactionHash;
        if (!hash) continue;

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

      // Filter by volume if needed
      let filteredTransactions = Array.from(transactionMap.values());
      if (minVolume !== undefined || maxVolume !== undefined) {
        filteredTransactions = filteredTransactions.filter((entry) => {
          // Calculate volume (same logic as in mapper)
          let volume = 0n;
          if (entry.transfers.length > 0) {
            volume = entry.transfers.reduce(
              (sum, transfer) => sum + (transfer.amount || 0n),
              0n,
            );
          } else if (entry.delegations.length > 0) {
            volume = entry.delegations.reduce((sum, delegation) => {
              const delegatedValue = delegation.delegatedValue || 0n;
              // Only add positive values (ignore negative or zero)
              return delegatedValue > 0n ? sum + delegatedValue : sum;
            }, 0n);
          }

          // Apply volume filters
          if (minVolume !== undefined && volume <= BigInt(minVolume)) {
            return false;
          }
          if (maxVolume !== undefined && volume >= BigInt(maxVolume)) {
            return false;
          }
          return true;
        });
      }

      return filteredTransactions.length;
    }

    // If no volume filtering, use efficient COUNT query
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
    isTreasury?: boolean;
    isBurning?: boolean;
    isTotal?: boolean;
    isCirculating?: boolean;
  } {
    if (!affectedSupply || affectedSupply.length === 0) {
      return {};
    }

    const filters: {
      isCex?: boolean;
      isDex?: boolean;
      isLending?: boolean;
      isTreasury?: boolean;
      isBurning?: boolean;
      isTotal?: boolean;
      isCirculating?: boolean;
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
    if (affectedSupply.includes("TREASURY")) {
      filters.isTreasury = true;
    }
    if (affectedSupply.includes("BURNING")) {
      filters.isBurning = true;
    }
    if (affectedSupply.includes("TOTAL")) {
      filters.isTotal = true;
    }
    if (affectedSupply.includes("CIRCULATING")) {
      filters.isCirculating = true;
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
      isTreasury?: boolean;
      isBurning?: boolean;
      isTotal?: boolean;
      isCirculating?: boolean;
    },
  ) {
    const whereConditions = [];

    // Handle nested from filtering
    if (from) {
      const fromConditions = [
        eq(transaction.fromAddress, from),
        and(
          isNotNull(transfer.transactionHash),
          eq(transfer.fromAccountId, from),
        ),
        and(
          isNotNull(delegation.transactionHash),
          eq(delegation.delegatorAccountId, from),
        ),
      ];
      whereConditions.push(or(...fromConditions));
    }

    // Handle nested to filtering
    if (to) {
      const toConditions = [
        eq(transaction.toAddress, to),
        and(isNotNull(transfer.transactionHash), eq(transfer.toAccountId, to)),
        and(
          isNotNull(delegation.transactionHash),
          eq(delegation.delegateAccountId, to),
        ),
      ];
      whereConditions.push(or(...toConditions));
    }

    // Apply affectedSupply filters
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
    if (affectedSupplyFilters.isTreasury !== undefined) {
      whereConditions.push(
        eq(transaction.isTreasury, affectedSupplyFilters.isTreasury),
      );
    }
    if (affectedSupplyFilters.isBurning !== undefined) {
      whereConditions.push(
        eq(transaction.isBurning, affectedSupplyFilters.isBurning),
      );
    }
    if (affectedSupplyFilters.isTotal !== undefined) {
      whereConditions.push(
        eq(transaction.isTotal, affectedSupplyFilters.isTotal),
      );
    }
    if (affectedSupplyFilters.isCirculating !== undefined) {
      whereConditions.push(
        eq(transaction.isCirculating, affectedSupplyFilters.isCirculating),
      );
    }

    return whereConditions;
  }
}
