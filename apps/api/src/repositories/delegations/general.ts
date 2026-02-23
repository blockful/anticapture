import { desc, eq } from "drizzle-orm";
import { Address } from "viem";

import { Drizzle, delegation } from "@/database";
import { DBDelegation } from "@/mappers";

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
