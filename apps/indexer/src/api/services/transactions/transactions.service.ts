import { TransactionsRepository } from "../../repositories/transactions.repository";
import {
  TransactionMapper,
  TransactionsRequest,
  TransactionsResponse,
} from "../../mappers/transactions";
import { containsAnyValue } from "@/lib/utils";

export class TransactionsService {
  constructor(private transactionsRepository: TransactionsRepository) {}

  async getTransactions(
    params: TransactionsRequest,
  ): Promise<TransactionsResponse> {
    const isFiltered = containsAnyValue({
      from: params.from,
      to: params.to,
      minAmount: params.minAmount,
      maxAmount: params.maxAmount,
      affectedSupply: params.affectedSupply,
    });

    const result = isFiltered
      ? await this.transactionsRepository.getFilteredAggregateTransactions(
          params,
        )
      : await this.transactionsRepository.getRecentAggregateTransactions();

    return {
      transactions: result.map(TransactionMapper.toApi),
    };
  }
}
