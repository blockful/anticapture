import { db } from "ponder:api";
import { transaction, transfer, delegation } from "ponder:schema";
import { eq, desc, asc, and, inArray, notInArray, gte, lte, sql } from "ponder";
import { TransactionMapper, TransactionsRequest, TransactionsResponse } from "../mappers/transactions";

type TransactionsResponseWithoutTotal = Omit<TransactionsResponse, 'total'>;

export class TransactionsRepository {
  async getTransactionsWithChildren(params: TransactionsRequest = {}): Promise<TransactionsResponseWithoutTotal> {
    const {
      limit = 50,
      offset = 0,
      sortBy = "timestamp",
      sortOrder = "desc",
      from,
      to,
      minVolume,
      maxVolume,
    } = params;

    // Build where conditions
    const whereConditions = [];
    if (from) {
      whereConditions.push(eq(transaction.fromAddress, from));
    }
    if (to) {
      whereConditions.push(eq(transaction.toAddress, to));
    }

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
        .leftJoin(transfer, eq(transaction.transactionHash, transfer.transactionHash))
        .leftJoin(delegation, eq(transaction.transactionHash, delegation.transactionHash))
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
        .orderBy(sortBy === "timestamp" ? (sortOrder === "desc" ? desc(transaction.timestamp) : asc(transaction.timestamp)) : desc(transaction.timestamp));

      // Group the results by transaction
      const transactionMap = new Map<string, {
        transaction: typeof transaction.$inferSelect;
        transfers: typeof transfer.$inferSelect[];
        delegations: typeof delegation.$inferSelect[];
      }>();

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
      const filteredTransactions = Array.from(transactionMap.values()).filter(entry => {
        // Calculate volume (same logic as in mapper)
        let volume = 0n;
        if (entry.transfers.length > 0) {
          volume = entry.transfers.reduce((sum, transfer) => sum + (transfer.amount || 0n), 0n);
        } else if (entry.delegations.length > 0) {
          volume = entry.delegations.reduce((sum, delegation) => {
            const delegatedValue = delegation.delegatedValue || 0n;
            return delegatedValue > 0n ? sum + delegatedValue : sum;
          }, 0n);
        }

        // Apply volume filters
        if (minVolume !== undefined && volume < BigInt(minVolume)) {
          return false;
        }
        if (maxVolume !== undefined && volume > BigInt(maxVolume)) {
          return false;
        }
        return true;
      });

      // Apply pagination to filtered results
      const paginatedTransactions = filteredTransactions.slice(offset, offset + limit);

      // Map to API response using the mapper
      const mappedTransactions = paginatedTransactions.map(entry => 
        TransactionMapper.toApi(
          entry.transaction, 
          entry.transfers, 
          entry.delegations
        )
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
      .leftJoin(transfer, eq(transaction.transactionHash, transfer.transactionHash))
      .leftJoin(delegation, eq(transaction.transactionHash, delegation.transactionHash))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(sortBy === "timestamp" ? (sortOrder === "desc" ? desc(transaction.timestamp) : asc(transaction.timestamp)) : desc(transaction.timestamp))
      .limit(limit)
      .offset(offset);

    // Group the results by transaction
    const transactionMap = new Map<string, {
      transaction: typeof transaction.$inferSelect;
      transfers: typeof transfer.$inferSelect[];
      delegations: typeof delegation.$inferSelect[];
    }>();

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
    const mappedTransactions = Array.from(transactionMap.values()).map(entry => 
      TransactionMapper.toApi(
        entry.transaction, 
        entry.transfers, 
        entry.delegations
      )
    );

    return {
      transactions: mappedTransactions,
    };
  }

  async getTransactionCount(params: { from?: string; to?: string; minVolume?: number; maxVolume?: number } = {}): Promise<number> {
    const { from, to, minVolume, maxVolume } = params;

    // Build where conditions
    const whereConditions = [];
    if (from) {
      whereConditions.push(eq(transaction.fromAddress, from));
    }
    if (to) {
      whereConditions.push(eq(transaction.toAddress, to));
    }

    // Get all transactions with their transfers and delegations in a single query
    const transactionsWithData = await db
      .select({
        transaction: transaction,
        transfer: transfer,
        delegation: delegation,
      })
      .from(transaction)
      .leftJoin(transfer, eq(transaction.transactionHash, transfer.transactionHash))
      .leftJoin(delegation, eq(transaction.transactionHash, delegation.transactionHash))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

    // Group the results by transaction
    const transactionMap = new Map<string, {
      transaction: typeof transaction.$inferSelect;
      transfers: typeof transfer.$inferSelect[];
      delegations: typeof delegation.$inferSelect[];
    }>();

    for (const row of transactionsWithData) {
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
      filteredTransactions = filteredTransactions.filter(entry => {
        // Calculate volume (same logic as in mapper)
        let volume = 0n;
        if (entry.transfers.length > 0) {
          volume = entry.transfers.reduce((sum, transfer) => sum + (transfer.amount || 0n), 0n);
        } else if (entry.delegations.length > 0) {
          volume = entry.delegations.reduce((sum, delegation) => {
            const delegatedValue = delegation.delegatedValue || 0n;
            return delegatedValue > 0n ? sum + delegatedValue : sum;
          }, 0n);
        }

        // Apply volume filters
        if (minVolume !== undefined && volume < BigInt(minVolume)) {
          return false;
        }
        if (maxVolume !== undefined && volume > BigInt(maxVolume)) {
          return false;
        }
        return true;
      });
    }

    return filteredTransactions.length;
  }
} 