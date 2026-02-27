import { Address } from "viem";

import {
  DBDelegation,
  DelegationItem,
  DelegationsRequestQuery,
} from "@/mappers";

interface Repository {
  getDelegations(
    address: Address,
    sort: DelegationsRequestQuery,
  ): Promise<DBDelegation | undefined>;
}

export class DelegationsService {
  constructor(private delegationsRepository: Repository) {}

  async getDelegations(
    address: Address,
    sort: DelegationsRequestQuery,
  ): Promise<DelegationItem | null> {
    const result = await this.delegationsRepository.getDelegations(
      address,
      sort,
    );

    if (!result) return null;

    return {
      amount: result.delegatedValue.toString(),
      timestamp: result.timestamp.toString(),
      transactionHash: result.transactionHash,
      delegatorAddress: result.delegatorAccountId,
      delegateAddress: result.delegateAccountId,
    };
  }
}
