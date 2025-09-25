import { db } from "ponder:api";
import { transaction } from "ponder:schema";
import { asc, desc, inArray } from "ponder";

export class TransactionsRepository {
  async getTransactionsByHashesOnly(
    hashes: string[],
    limit: number,
    orderBy: "asc" | "desc",
  ) {
    return db.query.transaction.findMany({
      where: inArray(transaction.transactionHash, hashes),
      limit,
      orderBy:
        orderBy === "asc"
          ? asc(transaction.timestamp)
          : desc(transaction.timestamp),
      with: {
        transfers: true,
        delegations: true,
      },
    });
  }
}
