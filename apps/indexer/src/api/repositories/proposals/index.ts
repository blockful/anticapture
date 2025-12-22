import { Address } from "viem";
import {
  count,
  SQL,
  inArray,
  gte,
  notInArray,
  and,
  asc,
  desc,
  eq,
  gt,
  isNull,
  max,
  lte,
} from "drizzle-orm";
import {
  proposalsOnchain,
  accountPower,
  votesOnchain,
  votingPowerHistory,
} from "ponder:schema";

import { ReadonlyDrizzle } from "@/api/database";
import { DBProposal } from "@/api/mappers";

export class ProposalsRepository {
  constructor(private readonly db: ReadonlyDrizzle) {}

  async getProposals(
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
    status: string[] | undefined,
    fromDate: number | undefined,
    fromEndDate: number | undefined,
    proposalTypeExclude?: number[],
  ): Promise<DBProposal[]> {
    const whereClauses: SQL<unknown>[] = [];

    if (status && status.length > 0) {
      whereClauses.push(inArray(proposalsOnchain.status, status));
    }

    if (fromDate) {
      whereClauses.push(gte(proposalsOnchain.timestamp, BigInt(fromDate)));
    }

    if (fromEndDate) {
      whereClauses.push(
        gte(proposalsOnchain.endTimestamp, BigInt(fromEndDate)),
      );
    }
    if (proposalTypeExclude && proposalTypeExclude.length > 0) {
      whereClauses.push(
        notInArray(proposalsOnchain.proposalType, proposalTypeExclude),
      );
    }
    return await this.db
      .select()
      .from(proposalsOnchain)
      .where(and(...whereClauses))
      .orderBy(
        orderDirection === "asc"
          ? asc(proposalsOnchain.timestamp)
          : desc(proposalsOnchain.timestamp),
      )
      .limit(limit)
      .offset(skip);
  }

  async getProposalById(proposalId: string): Promise<DBProposal | undefined> {
    return await this.db.query.proposalsOnchain.findFirst({
      where: eq(proposalsOnchain.id, proposalId),
    });
  }

  async getProposalsCount(): Promise<number> {
    return this.db.$count(proposalsOnchain);
  }

  async getProposalNonVoters(
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
        votesOnchain,
        and(
          eq(votesOnchain.proposalId, proposalId),
          eq(votesOnchain.voterAccountId, accountPower.accountId),
        ),
      )
      .where(
        and(
          ...(addresses ? [inArray(accountPower.accountId, addresses)] : []),
          gt(accountPower.votingPower, 0n),
          isNull(votesOnchain.proposalId), // NULL means they didn't vote on this proposal
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

  async getProposalNonVotersCount(proposalId: string): Promise<number> {
    const countResult = await this.db
      .select({ count: count(accountPower.accountId) })
      .from(accountPower)
      .leftJoin(
        votesOnchain,
        and(
          eq(votesOnchain.proposalId, proposalId),
          eq(votesOnchain.voterAccountId, accountPower.accountId),
        ),
      )
      .where(
        and(gt(accountPower.votingPower, 0n), isNull(votesOnchain.proposalId)),
      );
    return countResult[0]?.count || 0;
  }

  async getLastVotersTimestamp(
    voters: Address[],
  ): Promise<Record<Address, bigint>> {
    const timestamps = await this.db
      .select({
        voterAccountId: votesOnchain.voterAccountId,
        lastVoteTimestamp: max(votesOnchain.timestamp),
      })
      .from(votesOnchain)
      .where(inArray(votesOnchain.voterAccountId, voters))
      .groupBy(votesOnchain.voterAccountId)
      .orderBy(desc(max(votesOnchain.timestamp)));
    return timestamps.reduce(
      (acc, { voterAccountId, lastVoteTimestamp }) => ({
        ...acc,
        [voterAccountId]: lastVoteTimestamp,
      }),
      {},
    );
  }

  async getVotingPowerVariation(
    voters: Address[],
    comparisonTimestamp: number,
  ): Promise<Record<Address, bigint>> {
    const currentPower = this.db.$with("current_power").as(
      this.db
        .selectDistinctOn([votingPowerHistory.accountId], {
          accountId: votingPowerHistory.accountId,
          votingPower: votingPowerHistory.votingPower,
        })
        .from(votingPowerHistory)
        .where(inArray(votingPowerHistory.accountId, voters))
        .orderBy(
          votingPowerHistory.accountId,
          desc(votingPowerHistory.timestamp),
        ),
    );

    const oldPower = this.db.$with("old_power").as(
      this.db
        .selectDistinctOn([votingPowerHistory.accountId], {
          accountId: votingPowerHistory.accountId,
          votingPower: votingPowerHistory.votingPower,
        })
        .from(votingPowerHistory)
        .where(
          and(
            inArray(votingPowerHistory.accountId, voters),
            lte(votingPowerHistory.timestamp, BigInt(comparisonTimestamp)),
          ),
        )
        .orderBy(
          votingPowerHistory.accountId,
          desc(votingPowerHistory.timestamp),
        ),
    );

    const result = await this.db
      .with(currentPower, oldPower)
      .select({
        voterAccountId: currentPower.accountId,
        currentVotingPower: currentPower.votingPower,
        oldVotingPower: oldPower.votingPower,
      })
      .from(currentPower)
      .leftJoin(oldPower, eq(currentPower.accountId, oldPower.accountId));

    return result.reduce(
      (acc, { voterAccountId, oldVotingPower, currentVotingPower }) => ({
        ...acc,
        [voterAccountId]: currentVotingPower - (oldVotingPower || 0n),
      }),
      {},
    );
  }
}
