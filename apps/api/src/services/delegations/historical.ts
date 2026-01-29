import { DBDelegation } from "@/mappers";
import { Address } from "viem";

interface Repository {

constructor(private readonly db: Drizzle) {}

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
