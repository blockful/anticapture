import {
  TransactionsRequest,
  TransactionsResponse,
  TransactionMapper,
  DBTransaction,
} from "@/mappers/";

interface TransactionsRepository {

constructor(private readonly db: Drizzle) {}

  getFilteredAggregateTransactions(
    req: TransactionsRequest,
  ): Promise<DBTransaction[]>;
  getAggregatedTransactionsCount(req: TransactionsRequest): Promise<number>;
}

export class TransactionsService {
  constructor(private transactionsRepository: TransactionsRepository) {}

  async getTransactions(
    params: TransactionsRequest,
  ): Promise<TransactionsResponse> {
    const [totalCount, result] = await Promise.all([
      this.transactionsRepository.getAggregatedTransactionsCount(params),
      this.transactionsRepository.getFilteredAggregateTransactions(params),
    ]);

    return {
      items: result.map(TransactionMapper.toApi),
      totalCount,
    };
  }
}
