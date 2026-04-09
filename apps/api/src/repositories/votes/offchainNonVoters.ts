import { and, asc, desc, gt, isNull, eq, inArray, count } from "drizzle-orm";
import { Address } from "viem";

import {
  UnifiedDrizzle,
  accountPower,
  offchainProposals,
  offchainVotes,
} from "@/database";

export interface OffchainNonVotersRepository {
  proposalExists(proposalId: string): Promise<boolean>;
  getOffchainNonVoters(
    proposalId: string,
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
    addresses?: Address[],
  ): Promise<{ voter: Address; votingPower: bigint }[]>;
  getOffchainNonVotersCount(
    proposalId: string,
    addresses?: Address[],
  ): Promise<number>;
}

export class OffchainNonVotersRepositoryImpl implements OffchainNonVotersRepository {
  constructor(private readonly db: UnifiedDrizzle) {}

  async proposalExists(proposalId: string): Promise<boolean> {
    const result = await this.db
      .select({ id: offchainProposals.id })
      .from(offchainProposals)
      .where(eq(offchainProposals.id, proposalId));
    return result.length > 0;
  }

  async getOffchainNonVoters(
    proposalId: string,
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
    addresses?: Address[],
  ): Promise<{ voter: Address; votingPower: bigint }[]> {
    return await this.db
      .select({
        voter: accountPower.accountId,
        votingPower: accountPower.votingPower,
      })
      .from(accountPower)
      .leftJoin(
        offchainVotes,
        and(
          eq(offchainVotes.proposalId, proposalId),
          eq(offchainVotes.voter, accountPower.accountId),
        ),
      )
      .where(
        and(
          ...(addresses ? [inArray(accountPower.accountId, addresses)] : []),
          gt(accountPower.votingPower, 0n),
          isNull(offchainVotes.proposalId),
        ),
      )
      .orderBy(
        orderDirection === "asc"
          ? asc(accountPower.votingPower)
          : desc(accountPower.votingPower),
      )
      .limit(limit)
      .offset(skip);
  }

  async getOffchainNonVotersCount(
    proposalId: string,
    addresses?: Address[],
  ): Promise<number> {
    const countResult = await this.db
      .select({ count: count(accountPower.accountId) })
      .from(accountPower)
      .leftJoin(
        offchainVotes,
        and(
          eq(offchainVotes.proposalId, proposalId),
          eq(offchainVotes.voter, accountPower.accountId),
        ),
      )
      .where(
        and(
          ...(addresses ? [inArray(accountPower.accountId, addresses)] : []),
          gt(accountPower.votingPower, 0n),
          isNull(offchainVotes.proposalId),
        ),
      );
    return countResult[0]?.count || 0;
  }
}
