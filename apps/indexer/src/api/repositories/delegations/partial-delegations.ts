import { DBDelegation } from "@/api/mappers";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "ponder:api";
import { delegation } from "ponder:schema";
import { Address } from "viem";

export class PartialDelegationsRepository {
  async getDelegations(address: Address): Promise<DBDelegation[]> {
    const delegations = await db
      .select({
        transactionHash: delegation.transactionHash,
        delegatorAccountId: delegation.delegatorAccountId,
        timestamp: delegation.timestamp,
        previousDelegate: delegation.previousDelegate,
        partials: sql<{ delegate: string; value: bigint }[]>`jsonb_agg(
          jsonb_build_object(
            'delegate', ${delegation.delegateAccountId}, 
            'value', ${delegation.delegatedValue}
          )
        )`.as("partials"),
      })
      .from(delegation)
      .where(eq(delegation.delegatorAccountId, address))
      .groupBy(
        delegation.transactionHash,
        delegation.delegatorAccountId,
        delegation.timestamp,
      )
      .orderBy(desc(delegation.timestamp));

    const current = delegations[0];

    if (!current) {
      return [];
    }

    return current.partials.map((partial) => ({
      timestamp: current.timestamp,
      transactionHash: current.transactionHash,
      delegateAccountId: partial.delegate,
      delegatorAccountId: current.delegatorAccountId,
      delegatedValue: partial.value,
      previousDelegate: current.previousDelegate,
    }));
  }
}
