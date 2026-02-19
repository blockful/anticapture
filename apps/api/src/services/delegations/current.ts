import { DBDelegation, DelegationsRequestQuery } from "@/mappers";
import { Address } from "viem";

interface Repository {
  getDelegations(
    address: Address,
    sort: DelegationsRequestQuery,
  ): Promise<DBDelegation[]>;
}

export class DelegationsService {
  constructor(private delegationsRepository: Repository) {}

  async getDelegations(
    address: Address,
    sort: DelegationsRequestQuery,
  ): Promise<DBDelegation[]> {
    return this.delegationsRepository.getDelegations(address, sort);
  }
}
