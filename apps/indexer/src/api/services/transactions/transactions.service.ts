import {
  TransactionsRepository,
  AffectedSupplyFilters,
} from "../../repositories/transactions.repository";
import { TransfersRepository } from "../../repositories/transfers.repository";
import { DelegationsRepository } from "../../repositories/delegations.repository";
import {
  TransactionsRequest,
  TransactionsResponse,
  TransactionMapper,
  DBTransaction,
  DBTransfer,
  DBDelegation,
  AffectedSupply,
} from "../../mappers/transactions";

export class TransactionsService {
  constructor(
    private transactionsRepository: TransactionsRepository,
    private transfersRepository = new TransfersRepository(),
    private delegationsRepository = new DelegationsRepository(),
  ) {}

  async getTransactions(
    params: TransactionsRequest = {},
  ): Promise<TransactionsResponse> {
    const { limit, offset } = this.buildPagination(params);
    const sorting = this.buildSorting(params);
    const affectedSupplyFilters = this.parseAffectedSupply(
      Array.isArray(params.affectedSupply)
        ? params.affectedSupply
        : params.affectedSupply
          ? [params.affectedSupply]
          : undefined,
    );

    // 1) Page transfers and delegations independently with the same limit/offset
    const pagedTransfers = await this.transfersRepository.getTransfers(
      "timestamp",
      sorting.sortOrder as "asc" | "desc",
      {
        from: params.from,
        to: params.to,
        affectedSupply: affectedSupplyFilters,
        minAmount: params.minAmount ? BigInt(params.minAmount) : undefined,
        maxAmount: params.maxAmount ? BigInt(params.maxAmount) : undefined,
        limit,
        offset,
      },
    );

    const pagedDelegations = await this.delegationsRepository.getDelegations(
      "timestamp",
      sorting.sortOrder as "asc" | "desc",
      {
        from: params.from,
        to: params.to,
        affectedSupply: affectedSupplyFilters,
        minAmount: params.minAmount ? BigInt(params.minAmount) : undefined,
        maxAmount: params.maxAmount ? BigInt(params.maxAmount) : undefined,
        limit,
        offset,
      },
    );

    // 2) Collect transaction hashes from the page results
    const pageHashes = new Set<string>();
    for (const t of pagedTransfers)
      if (t.transactionHash) pageHashes.add(t.transactionHash);
    for (const d of pagedDelegations)
      if (d.transactionHash) pageHashes.add(d.transactionHash);

    const hashArray = Array.from(pageHashes);

    // 3) Fetch ALL transfers/delegations for those hashes
    const [allTransfers, allDelegations] = await Promise.all([
      this.transfersRepository.getTransfersByHash(hashArray),
      this.delegationsRepository.getDelegationsByHash(hashArray),
    ]);

    // 4) Fetch transactions for those hashes
    const transactions =
      await this.transactionsRepository.getTransactionsByHashesOnly(hashArray);

    // 4) Map grouped response
    const grouped = this.groupTransactionsWithChildren(
      transactions as unknown as DBTransaction[],
      allTransfers as unknown as DBTransfer[],
      allDelegations as unknown as DBDelegation[],
    );

    const mapped = grouped.map((g) =>
      TransactionMapper.toApi(g.transaction, g.transfers, g.delegations),
    );

    // 5) Counts using count() for each type
    const transactionsCount =
      await this.transactionsRepository.getTransactionsCount({
        from: params.from,
        to: params.to,
        affectedSupplyFilters,
        minAmount: params.minAmount,
        maxAmount: params.maxAmount,
      });

    return {
      transactions: mapped,
      total: transactionsCount,
    };
  }

  private buildPagination(params: TransactionsRequest) {
    return {
      limit: Math.min(Math.max(params.limit ?? 10, 1), 100),
      offset: params.offset || 0,
    };
  }

  private buildSorting(params: TransactionsRequest) {
    return {
      sortBy: params.sortBy || "timestamp",
      sortOrder: params.sortOrder || "desc",
    };
  }

  private parseAffectedSupply(
    affectedSupply?: AffectedSupply[],
  ): AffectedSupplyFilters {
    if (!affectedSupply?.length) return {};

    return {
      isCex: affectedSupply.includes(AffectedSupply.CEX),
      isDex: affectedSupply.includes(AffectedSupply.DEX),
      isLending: affectedSupply.includes(AffectedSupply.LENDING),
      isTotal: affectedSupply.includes(AffectedSupply.TOTAL),
    };
  }

  private groupTransactionsWithChildren(
    transactions: DBTransaction[],
    transfers: DBTransfer[],
    delegations: DBDelegation[],
  ) {
    const transactionMap = new Map();

    // Initialize with transactions
    transactions.forEach((txn) => {
      transactionMap.set(txn.transactionHash, {
        transaction: txn,
        transfers: [],
        delegations: [],
      });
    });

    // Group transfers by transaction
    transfers.forEach((transfer) => {
      const group = transactionMap.get(transfer.transactionHash);
      if (group) group.transfers.push(transfer);
    });

    // Group delegations by transaction
    delegations.forEach((delegation) => {
      const group = transactionMap.get(delegation.transactionHash);
      if (group) group.delegations.push(delegation);
    });

    return Array.from(transactionMap.values());
  }
}
