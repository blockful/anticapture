import { desc, eq } from "drizzle-orm";
import { Address } from "viem";

import { Drizzle, accountBalance, delegation } from "@/database";
import { DBDelegation } from "@/mappers";

export class DelegationsRepository {
  constructor(private readonly db: Drizzle) {}

  async getDelegations(address: Address): Promise<DBDelegation | undefined> {
    const delegator = await this.db.query.accountBalance.findFirst({
      where: eq(accountBalance.accountId, address),
      columns: {
        delegate: true,
      },
    });

    if (!delegator) return undefined;

    return await this.db.query.delegation.findFirst({
      where: eq(delegation.delegatorAccountId, delegator.delegate),
      orderBy: [desc(delegation.timestamp), desc(delegation.logIndex)],
    });
  }
}
