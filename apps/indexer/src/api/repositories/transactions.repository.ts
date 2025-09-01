import { db } from "ponder:api";
import { transaction } from "ponder:schema";
import { inArray } from "ponder";

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
}
