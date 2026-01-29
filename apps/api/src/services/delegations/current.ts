import { DBDelegation } from "@/mappers";
import { Address } from "viem";

interface Repository {

constructor(private readonly db: Drizzle) {}

  getDelegations(address: Address): Promise<DBDelegation[]>;
}

export class DelegationsService {
  constructor(private delegationsRepository: Repository) {}

  async getDelegations(address: Address): Promise<DBDelegation[]> {
    return this.delegationsRepository.getDelegations(address);
  }
}
