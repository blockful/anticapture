import { asc, desc, eq } from "drizzle-orm";
import { Address } from "viem";

import { Drizzle, delegation } from "@/database";
import { DBDelegation, DelegationsRequestQuery } from "@/mappers";

export class DelegationsRepository {
  constructor(private readonly db: Drizzle) {}

  async getDelegations(
    address: Address,
    sort: DelegationsRequestQuery,
  ): Promise<DBDelegation | undefined> {
    const direction = sort.orderDirection === "asc" ? asc : desc;
    const column =
      sort.orderBy === "amount"
        ? delegation.delegatedValue
        : delegation.timestamp;

    return await this.db.query.delegation.findFirst({
      where: eq(delegation.delegateAccountId, address),
      orderBy: [direction(column), desc(delegation.logIndex)],
    });
  }
}
