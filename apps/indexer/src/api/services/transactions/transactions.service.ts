import { TransactionsRepository } from "../../repositories/transactions.repository";
import {
  TransactionsRequest,
  TransactionsResponse,
  TransactionMapper,
} from "../../mappers/transactions";

type AffectedSupplyFilters = {
  isCex?: boolean;
  isDex?: boolean;
  isLending?: boolean;
  isTotal?: boolean;
};

type TransactionFilters = {
  from?: string;
  to?: string;
  minAmount?: number;
  maxAmount?: number;
  affectedSupplyFilters: AffectedSupplyFilters;
};

export class TransactionsService {
  constructor(private repository: TransactionsRepository) {}

  async getTransactionsWithChildren(
    params: TransactionsRequest = {},
  ): Promise<TransactionsResponse> {
    const filters = this.buildFilters(params);
    const pagination = this.buildPagination(params);
    const sorting = this.buildSorting(params);

    // Business rule: Get transactions that match ANY of the criteria
    const qualifyingTransactionHashes =
      await this.findQualifyingTransactions(filters);

    if (qualifyingTransactionHashes.length === 0) {
      return { transactions: [], total: 0 };
    }

    // Get paginated transactions and their related data
    const [transactions, transfers, delegations] = await Promise.all([
      this.repository.getTransactionsByHashes(
        qualifyingTransactionHashes,
        pagination,
        sorting,
      ),
      this.repository.getTransfersForTransactions(qualifyingTransactionHashes),
      this.repository.getDelegationsForTransactions(
        qualifyingTransactionHashes,
      ),
    ]);

    // Business logic: Group transactions with their children
    const groupedTransactions = this.groupTransactionsWithChildren(
      transactions,
      transfers,
      delegations,
    );

    // Business logic: Map to API response format
    const mappedTransactions = groupedTransactions.map((group) =>
      TransactionMapper.toApi(
        group.transaction,
        group.transfers,
        group.delegations,
      ),
    );

    const total = qualifyingTransactionHashes.length;

    return {
      transactions: mappedTransactions,
      total,
    };
  }

  private buildFilters(params: TransactionsRequest): TransactionFilters {
    return {
      from: params.from,
      to: params.to,
      minAmount: params.minAmount,
      maxAmount: params.maxAmount,
      affectedSupplyFilters: this.parseAffectedSupply(params.affectedSupply),
    };
  }

  private buildPagination(params: TransactionsRequest) {
    return {
      limit: params.limit || 50,
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
    affectedSupply?: string[],
  ): AffectedSupplyFilters {
    if (!affectedSupply?.length) return {};

    return {
      isCex: affectedSupply.includes("CEX"),
      isDex: affectedSupply.includes("DEX"),
      isLending: affectedSupply.includes("LENDING"),
      isTotal: affectedSupply.includes("TOTAL"),
    };
  }

  private async findQualifyingTransactions(
    filters: TransactionFilters,
  ): Promise<string[]> {
    // Business rule: If no filters, return all transactions
    if (this.hasNoFilters(filters)) {
      return this.repository.getAllTransactionHashes();
    }

    // Business rule: Transaction qualifies if ANY transfer, delegation, or transaction matches
    const [transactionMatches, transferMatches, delegationMatches] =
      await Promise.all([
        this.repository.findTransactionsByFilters(filters),
        this.repository.findTransactionsByTransferFilters(filters),
        this.repository.findTransactionsByDelegationFilters(filters),
      ]);

    // Business rule: Combine all matches (union)
    const allMatches = new Set([
      ...transactionMatches,
      ...transferMatches,
      ...delegationMatches,
    ]);

    return Array.from(allMatches);
  }

  private hasNoFilters(filters: TransactionFilters): boolean {
    return (
      !filters.from &&
      !filters.to &&
      filters.minAmount === undefined &&
      filters.maxAmount === undefined &&
      Object.keys(filters.affectedSupplyFilters).length === 0
    );
  }

  private groupTransactionsWithChildren(
    transactions: any[],
    transfers: any[],
    delegations: any[],
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
