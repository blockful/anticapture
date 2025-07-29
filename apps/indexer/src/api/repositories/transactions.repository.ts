import { db } from "ponder:api";
import { transaction, transfer, delegation } from "ponder:schema";
import { eq, desc, asc, and, inArray, sql } from "ponder";
import { TransactionMapper, TransactionsRequest, TransactionsResponse } from "../mappers/transactions";

export class TransactionsRepository {
  async getTransactionsWithChildren(params: TransactionsRequest = {}): Promise<TransactionsResponse> {
    const {
      limit = 50,
      offset = 0,
      sortBy = "timestamp",
      sortOrder = "desc",
      from,
      to,
    } = params;

    // Build where conditions
    const whereConditions = [];
    if (from) {
      whereConditions.push(eq(transaction.fromAddress, from));
    }
    if (to) {
      whereConditions.push(eq(transaction.toAddress, to));
    }

    // Get transactions
    const transactions = await db
      .select()
      .from(transaction)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(sortBy === "timestamp" ? (sortOrder === "desc" ? desc(transaction.timestamp) : asc(transaction.timestamp)) : desc(transaction.timestamp))
      .limit(limit)
      .offset(offset);

    // Get transfers for these transactions
    const transactionHashes = transactions.map(t => t.transactionHash).filter(Boolean);
    const transfers = await db
      .select()
      .from(transfer)
      .where(transactionHashes.length > 0 ? inArray(transfer.transactionHash, transactionHashes) : undefined);

    // Get delegations for these transactions
    const delegations = await db
      .select()
      .from(delegation)
      .where(transactionHashes.length > 0 ? inArray(delegation.transactionHash, transactionHashes) : undefined);

    // Group transfers and delegations by transaction hash
    const transfersByHash = transfers.reduce((acc, t) => {
      const hash = t.transactionHash;
      if (hash) {
        if (!acc[hash]) {
          acc[hash] = [];
        }
        acc[hash].push(t);
      }
      return acc;
    }, {} as Record<string, typeof transfers>);

    const delegationsByHash = delegations.reduce((acc, d) => {
      const hash = d.transactionHash;
      if (hash) {
        if (!acc[hash]) {
          acc[hash] = [];
        }
        acc[hash].push(d);
      }
      return acc;
    }, {} as Record<string, typeof delegations>);

    // Map to API response using the mapper
    const mappedTransactions = transactions.map(t => 
      TransactionMapper.toApi(
        t, 
        transfersByHash[t.transactionHash || ""] || [], 
        delegationsByHash[t.transactionHash || ""] || []
      )
    );

    return {
      transactions: mappedTransactions,
      total: 0, // Will be set by service
    };
  }

  async getTransactionCount(params: { from?: string; to?: string } = {}): Promise<number> {
    const { from, to } = params;

    // Build where conditions
    const whereConditions = [];
    if (from) {
      whereConditions.push(eq(transaction.fromAddress, from));
    }
    if (to) {
      whereConditions.push(eq(transaction.toAddress, to));
    }

    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(transaction)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

    return result[0]?.count || 0;
  }
} 