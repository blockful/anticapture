import { Address } from "viem";

import { DBFormerDelegator } from "@/mappers";

interface Repository {
  getFormerDelegators(
    address: Address,
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
  ): Promise<{ items: DBFormerDelegator[]; totalCount: number }>;
}

export class FormerDelegatorsService {
  constructor(private readonly formerDelegatorsRepository: Repository) {}

  async getFormerDelegators(
    address: Address,
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
  ): Promise<{ items: DBFormerDelegator[]; totalCount: number }> {
    return this.formerDelegatorsRepository.getFormerDelegators(
      address,
      skip,
      limit,
      orderDirection,
    );
  }
}
