import { DBDelegation } from "@/api/mappers";
import { desc, eq } from "drizzle-orm";
import { db } from "ponder:api";
import { delegation } from "ponder:schema";
import { Address } from "viem";

export class DelegationsRepository {
  async getDelegations(address: Address): Promise<DBDelegation[]> {
    const result = await db.query.delegation.findMany({
      where: eq(delegation.delegateAccountId, address),
      orderBy: [desc(delegation.timestamp), desc(delegation.logIndex)],
    });

    return result;
  }
}
