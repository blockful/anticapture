import { TransactionsRepository } from "../../repositories/transactions.repository";
import { TransfersRepository } from "../../repositories/transfers.repository";
import { DelegationsRepository } from "../../repositories/delegations.repository";
import {
  TransactionsRequest,
  TransactionsResponse,
  TransactionMapper,
} from "../../mappers/transactions";

export class TransactionsService {
  constructor(
    private transactionsRepository: TransactionsRepository,
    private transfersRepository = new TransfersRepository(),
    private delegationsRepository = new DelegationsRepository(),
  ) {}

  async getTransactions(
    params: TransactionsRequest,
  ): Promise<TransactionsResponse> {
    const { limit, offset, sortOrder, affectedSupply } = params;

    // 1) Page transfers and delegations independently with the same limit/offset
    const pagedTransfersTxHashes =
      await this.transfersRepository.getTransfersTransactionHashesWithTimestamp(
        {
          from: params.from,
          to: params.to,
          affectedSupply,
          minAmount: params.minAmount,
          maxAmount: params.maxAmount,
          limit,
          offset,
          sortBy: "timestamp",
          sortOrder,
        },
      );

    const pagedDelegationsTxHashes =
      await this.delegationsRepository.getDelegationsTransactionHashesWithTimestamp(
        {
          from: params.from,
          to: params.to,
          affectedSupply,
          minAmount: params.minAmount ? BigInt(params.minAmount) : undefined,
          maxAmount: params.maxAmount ? BigInt(params.maxAmount) : undefined,
          limit,
          offset,
          sortBy: "timestamp",
          sortOrder,
        },
      );

    // 2) Collect transaction hashes from the page results
    const pageHashes = [...pagedTransfersTxHashes, ...pagedDelegationsTxHashes]
      .sort((a, b) => Number(a.timestamp - b.timestamp))
      .reduce((acc, t) => {
        acc.add(t.transactionHash);
        return acc;
      }, new Set<string>());

    const hashArray = Array.from(pageHashes).slice(0, limit);

    // 4) Fetch transactions for those hashes
    const transactions =
      await this.transactionsRepository.getTransactionsByHashesOnly(
        hashArray,
        limit,
      );

    return {
      transactions: transactions.map(TransactionMapper.toApi),
    };
  }
}
