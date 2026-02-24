import { Address } from "viem";

import { AggregatedDelegator, DelegatorsRequestQuery } from "@/mappers";

export type DelegatorsSortOptions = Pick<
  DelegatorsRequestQuery,
  "orderBy" | "orderDirection"
>;

interface Repository {
  getDelegators(
    address: Address,
    skip: number,
    limit: number,
    sort: DelegatorsSortOptions,
  ): Promise<{ items: AggregatedDelegator[]; totalCount: number }>;
}

export class DelegatorsService {
  constructor(private delegatorsRepository: Repository) {}

  async getDelegators(
    address: Address,
    skip: number,
    limit: number,
    sort: DelegatorsSortOptions,
  ): Promise<{ items: AggregatedDelegator[]; totalCount: number }> {
    return this.delegatorsRepository.getDelegators(address, skip, limit, sort);
  }
}
