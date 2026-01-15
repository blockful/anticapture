import { DBDelegation } from "@/api/mappers";
// import { DelegationsResponse } from "@/api/mappers/delegations";
import { HistoricalDelegationsRepository } from "@/api/repositories/delegations";
import { Address } from "viem";

export class DelegationsService {
  constructor(private delegationsRepository: HistoricalDelegationsRepository) {}

  async getHistoricalDelegations(
    address: Address,
    orderDirection: "asc" | "desc",
    skip: number,
    limit: number,
  ): Promise<DBDelegation[]> {
    // const delegations = await Promise.all([
    //   this.delegationsRepository.getHistoricalDelegationsCount(address),
    // ]);

    return this.delegationsRepository.getHistoricalDelegations(
      address,
      orderDirection,
      skip,
      limit,
    );

    // return {
    //   items,
    //   totalCount,
    // };
  }
}
