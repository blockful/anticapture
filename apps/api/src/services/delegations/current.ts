import { Address } from "viem";

import { DBDelegation, DelegationItem } from "@/mappers";

interface Repository {
  getDelegations(address: Address): Promise<DBDelegation | undefined>;
}

export class DelegationsService {
  constructor(private delegationsRepository: Repository) {}

  async getDelegations(address: Address): Promise<{
    items: DelegationItem[];
    totalCount: number;
  }> {
    const result = await this.delegationsRepository.getDelegations(address);

    if (!result) return { items: [], totalCount: 0 };

    return {
      items: [
        {
          amount: result.delegatedValue.toString(),
          timestamp: result.timestamp.toString(),
          transactionHash: result.transactionHash,
          delegatorAddress: result.delegatorAccountId,
          delegateAddress: result.delegateAccountId,
        },
      ],
      totalCount: 1,
    };
  }
}
