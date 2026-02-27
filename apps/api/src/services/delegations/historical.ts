import { Address } from "viem";

import { DBDelegation, DelegationItem } from "@/mappers";

interface Repository {
  getHistoricalDelegations(
    address: Address,
    orderDirection: "asc" | "desc",
    skip: number,
    limit: number,
    fromValue: bigint | undefined,
    toValue: bigint | undefined,
    delegateAddressIn: Address[] | undefined,
  ): Promise<{
    items: DBDelegation[];
    totalCount: number;
  }>;
}

export class HistoricalDelegationsService {
  constructor(private historicalDelegationsRepository: Repository) {}

  async getHistoricalDelegations(
    address: Address,
    fromValue: bigint | undefined,
    toValue: bigint | undefined,
    delegateAddressIn: Address[] | undefined,
    orderDirection: "asc" | "desc",
    skip: number,
    limit: number,
  ): Promise<{
    items: DelegationItem[];
    totalCount: number;
  }> {
    const result =
      await this.historicalDelegationsRepository.getHistoricalDelegations(
        address,
        orderDirection,
        skip,
        limit,
        fromValue,
        toValue,
        delegateAddressIn,
      );

    return {
      items: result.items.map((item) => ({
        delegatorAddress: item.delegatorAccountId,
        delegateAddress: item.delegateAccountId,
        amount: item.delegatedValue.toString(),
        timestamp: item.timestamp.toString(),
        transactionHash: item.transactionHash,
      })),
      totalCount: result.totalCount,
    };
  }
}
