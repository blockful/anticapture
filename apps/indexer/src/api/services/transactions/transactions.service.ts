import { TransactionsRepository } from "../../repositories/transactions.repository";
import {
  TransactionMapper,
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
    return {
      transactions: result.map(TransactionMapper.toApi),
    };
  }
}
