import { TransactionsRepository } from "../../repositories/transactions.repository";
import { TransactionsRequest, TransactionsResponse } from "../../mappers/transactions";

export class TransactionsService {
  constructor(private repository: TransactionsRepository) {}

  async getTransactionsWithChildren(params: TransactionsRequest = {}): Promise<TransactionsResponse> {
    const { from, to } = params;

    // Get transactions with their children
    const result = await this.repository.getTransactionsWithChildren(params);

    // Get total count for pagination
    const total = await this.repository.getTransactionCount({ from, to });

    return {
      ...result,
      total,
    };
  }
} 