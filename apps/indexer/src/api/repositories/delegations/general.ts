import { DBDelegation } from "@/api/mappers";
import { desc, eq } from "drizzle-orm";
import { db } from "ponder:api";
import { delegation } from "ponder:schema";
import { Address } from "viem";

export class DelegationsRepository {
  async getDelegations(address: Address): Promise<DBDelegation[]> {
    // Get only the latest delegation
    const latestDelegation = await db
      .select()
      .from(delegation)
      .where(eq(delegation.delegatorAccountId, address))
      .orderBy(desc(delegation.timestamp), desc(delegation.logIndex))
      .limit(1);

    return latestDelegation;
  }
}
