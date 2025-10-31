import {
  TransactionsRequest,
  TransactionsResponse,
  TransactionMapper,
  DBTransaction,
} from "../../mappers/transactions";
import { containsAnyValue } from "../utils";

interface TransactionsRepository {
  getFilteredAggregateTransactions(
    req: TransactionsRequest,
  ): Promise<DBTransaction[]>;
  getAggregatedTransactionsCount(req: TransactionsRequest): Promise<number>;
  getRecentAggregateTransactions(
    req: TransactionsRequest,
  ): Promise<DBTransaction[]>;
}

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

    const [totalCount, result] = await Promise.all([
      this.transactionsRepository.getAggregatedTransactionsCount(params),
      isFiltered
        ? this.transactionsRepository.getFilteredAggregateTransactions(params)
        : this.transactionsRepository.getRecentAggregateTransactions(params),
    ]);

    return {
      items: result.map(TransactionMapper.toApi),
      totalCount,
    };
  }
}
