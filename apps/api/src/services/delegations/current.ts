import { Address } from "viem";

import { DBDelegation } from "@/mappers";

interface Repository {
  getDelegations(address: Address): Promise<DBDelegation[]>;
}

export class DelegationsService {
  constructor(private delegationsRepository: Repository) {}

  async getDelegations(address: Address): Promise<DBDelegation[]> {
    return this.delegationsRepository.getDelegations(address);
  }
}
