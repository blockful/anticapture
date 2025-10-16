import { TransactionsRepository } from "../../repositories/transactions.repository";
import {
  TransactionsRequest,
  TransactionsResponse,
} from "../../mappers/transactions";

export class TransactionsService {
  constructor(private transactionsRepository: TransactionsRepository) {}

  async getTransactions(
    params: TransactionsRequest,
  ): Promise<TransactionsResponse> {
    const result =
      await this.transactionsRepository.getAggregateTransactions(params);
    console.log(result.rows);
    return {
      transactions: [],
    };
  }
}
