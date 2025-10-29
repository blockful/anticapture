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
  getFilteredAggregateTransactionsCount(
    req: TransactionsRequest,
  ): Promise<number>;
  getRecentAggregateTransactions(
    req: TransactionsRequest,
  ): Promise<DBTransaction[]>;
  getRecentAggregateTransactionsCount(
    req: TransactionsRequest,
  ): Promise<number>;
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

    const [result, totalCount] = await Promise.all(
      isFiltered
        ? [
            this.transactionsRepository.getFilteredAggregateTransactions(
              params,
            ),
            this.transactionsRepository.getFilteredAggregateTransactionsCount(
              params,
            ),
          ]
        : [
            this.transactionsRepository.getRecentAggregateTransactions(params),
            this.transactionsRepository.getRecentAggregateTransactionsCount(
              params,
            ),
          ],
    );

    return {
      items: result.map(TransactionMapper.toApi),
      totalCount,
    };
  }
}
