import { DBDelegation } from "@/mappers";
import { desc, eq } from "drizzle-orm";
import { Drizzle, delegation } from "@/database";
import { Address } from "viem";

export class DelegationsRepository {
  constructor(private readonly db: Drizzle) {}

  async getDelegations(address: Address): Promise<DBDelegation[]> {
    const result = await this.db.query.delegation.findMany({
      where: eq(delegation.delegateAccountId, address),
      orderBy: [desc(delegation.timestamp), desc(delegation.logIndex)],
    });

    return result;
  }
}
