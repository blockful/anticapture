import { db } from "ponder:api";
import {
  and,
  asc,
  desc,
  eq,
  gte,
  lte,
  SQL,
  inArray,
  gt,
  isNull,
  max,
  count,
} from "drizzle-orm";
import { accountPower, votesOnchain, votingPowerHistory } from "ponder:schema";

import { DBVote, VotesRequest } from "@/api/mappers";
import { Address } from "viem";

export class VotesRepository {
  async getVotes(
    req: VotesRequest,
  ): Promise<{ items: DBVote[]; totalCount: number }> {
    const sortBy =
      req.orderBy === "timestamp"
        ? votesOnchain.timestamp
        : votesOnchain.votingPower;
    const orderBy = req.orderDirection === "desc" ? desc(sortBy) : asc(sortBy);

    const where = and(
      req.fromDate
        ? gte(votesOnchain.timestamp, BigInt(req.fromDate))
        : undefined,
      req.toDate ? lte(votesOnchain.timestamp, BigInt(req.toDate)) : undefined,
    );

    const [items, totalCount] = await Promise.all([
      db.query.votesOnchain.findMany({
        where,
        limit: req.limit,
        offset: req.skip,
        orderBy,
      }),
      db.$count(votesOnchain, where),
    ]);
    return { items, totalCount };
  }

  async getProposalNonVoters(
    proposalId: string,
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
    addresses?: Address[],
  ): Promise<{ voter: Address; votingPower: bigint }[]> {
    return await db
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
    const countResult = await db
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
    const timestamps = await db
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
    const currentPower = db.$with("current_power").as(
      db
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

    const oldPower = db.$with("old_power").as(
      db
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

    const result = await db
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

  async getVotesByProposalId(
    proposalId: string,
    skip: number,
    limit: number,
    orderBy: "timestamp" | "votingPower",
    orderDirection: "asc" | "desc",
    voterAddresses?: Address[],
    support?: string,
    fromDate?: number,
    toDate?: number,
  ): Promise<{ items: DBVote[]; totalCount: number }> {
    const whereClauses: SQL<unknown>[] = [
      eq(votesOnchain.proposalId, proposalId),
    ];

    if (support !== undefined) {
      whereClauses.push(eq(votesOnchain.support, support));
    }

    if (voterAddresses !== undefined && voterAddresses.length > 0) {
      whereClauses.push(inArray(votesOnchain.voterAccountId, voterAddresses));
    }

    if (fromDate !== undefined) {
      whereClauses.push(gte(votesOnchain.timestamp, BigInt(fromDate)));
    }

    if (toDate !== undefined) {
      whereClauses.push(lte(votesOnchain.timestamp, BigInt(toDate)));
    }

    const orderByColumn =
      orderBy === "votingPower"
        ? votesOnchain.votingPower
        : votesOnchain.timestamp;
    const orderFn = orderDirection === "asc" ? asc : desc;

    const [items, totalCount] = await Promise.all([
      db
        .select()
        .from(votesOnchain)
        .where(and(...whereClauses))
        .orderBy(orderFn(orderByColumn))
        .limit(limit)
        .offset(skip),
      db.$count(votesOnchain, and(...whereClauses)),
    ]);
    return { items, totalCount };
  }
}
