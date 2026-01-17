import { DBDelegation } from "@/api/mappers";
import {
  DelegationsRepository,
  HistoricalDelegationsRepository,
} from "@/api/repositories/delegations";
import { Address } from "viem";

export class HistoricalDelegationsService {
  constructor(
    private historicalDelegationsRepository: HistoricalDelegationsRepository,
  ) {}

  async getHistoricalDelegations(
    address: Address,
    fromValue: bigint | undefined,
    toValue: bigint | undefined,
    delegateAddressIn: Address[] | undefined,
    orderDirection: "asc" | "desc",
    skip: number,
    limit: number,
  ): Promise<{
    items: DBDelegation[];
    totalCount: number;
  }> {
    return this.historicalDelegationsRepository.getHistoricalDelegations(
      address,
      orderDirection,
      skip,
      limit,
      fromValue,
      toValue,
      delegateAddressIn,
    );
  }
}

export class DelegationsService {
  constructor(private delegationsRepository: DelegationsRepository) {}

  async getDelegations(address: Address): Promise<DBDelegation[]> {
    return this.delegationsRepository.getDelegations(address);
  }
}
