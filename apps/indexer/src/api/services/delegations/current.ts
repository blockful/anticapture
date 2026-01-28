import { DBDelegation } from "@/api/mappers";
import { Address } from "viem";

interface Repository {
  getDelegations(address: Address): Promise<DBDelegation[]>;
}

export class DelegationsService {
  constructor(private delegationsRepository: Repository) {}

  async getDelegations(address: Address): Promise<DBDelegation[]> {
    return this.delegationsRepository.getDelegations(address);
  }
}
