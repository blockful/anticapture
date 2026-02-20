import { AggregatedDelegator } from "@/mappers";
import { asc, desc, eq, sql } from "drizzle-orm";
import { Drizzle } from "@/database";
import { accountBalance, delegation } from "@/database";
import { Address } from "viem";
import { DelegatorsSortOptions } from "@/services/delegations/delegators";

export class DelegatorsRepository {
  constructor(private readonly db: Drizzle) {}

  async getDelegators(
    address: Address,
    skip: number,
    limit: number,
    sort: DelegatorsSortOptions,
  ): Promise<{ items: AggregatedDelegator[]; totalCount: number }> {
    const latestDelegation = this.db
      .select({
        delegatorAccountId: delegation.delegatorAccountId,
        timestamp: sql<bigint>`MAX(${delegation.timestamp})`.as("timestamp"),
      })
      .from(delegation)
      .where(eq(delegation.delegateAccountId, address))
      .groupBy(delegation.delegatorAccountId)
      .as("latest_delegation");

    const direction = sort.orderDirection === "asc" ? asc : desc;
    const orderColumn =
      sort.orderBy === "amount"
        ? sql`SUM(${accountBalance.balance})`
        : latestDelegation.timestamp;

    const baseQuery = this.db
      .select({
        delegatorAddress: sql<Address>`${accountBalance.accountId}`.as(
          "delegator_address",
        ),
        amount: sql<bigint>`SUM(${accountBalance.balance})`.as("amount"),
        timestamp: latestDelegation.timestamp,
      })
      .from(accountBalance)
      .innerJoin(
        latestDelegation,
        eq(accountBalance.accountId, latestDelegation.delegatorAccountId),
      )
      .where(eq(accountBalance.delegate, address))
      .groupBy(accountBalance.accountId, latestDelegation.timestamp)
      .orderBy(direction(orderColumn));

    const totalCount = await this.db.$count(baseQuery.as("subquery"));
    const rows = await baseQuery.offset(skip).limit(limit);

    return {
      items: rows.map((row) => ({
        delegatorAddress: row.delegatorAddress,
        amount: BigInt(row.amount),
        timestamp: BigInt(row.timestamp),
      })),
      totalCount,
    };
  }
}
