import {
  and,
  lte,
  asc,
  desc,
  eq,
  gte,
  gt,
  inArray,
  sql,
  isNull,
  count,
  max,
} from "ponder";
import { db } from "ponder:api";
import {
  accountPower,
  proposalsOnchain,
  votesOnchain,
  votingPowerHistory,
} from "ponder:schema";
import { SQL } from "drizzle-orm";
import { Address } from "viem";

import {
  ActiveSupplyQueryResult,
  AverageTurnoutCompareQueryResult,
  ProposalsCompareQueryResult,
  VotesCompareQueryResult,
} from "../controller/governance-activity/types";
import { DaysEnum } from "@/lib/enums";
import { DBProposal } from "../mappers";

export class DrizzleRepository {
  async getSupplyComparison(metricType: string, days: DaysEnum) {
    const query = sql`
      WITH old_data AS (
        SELECT db.average as old_amount
        FROM dao_metrics_day_buckets db
        WHERE db."metricType" = ${metricType}
        AND db."date" <= ${this.now() - days}
        ORDER BY db."date" desc LIMIT 1
      ),
      current_data AS (
        SELECT db.average as current_amount
        FROM dao_metrics_day_buckets db
        WHERE db."metricType" = ${metricType}
        ORDER BY db."date" DESC LIMIT 1
      )
      SELECT COALESCE(old_data.old_amount, 0) AS "oldValue",
             COALESCE(current_data.current_amount, 0) AS "currentValue"
      FROM current_data
      LEFT JOIN old_data ON 1=1;
    `;

    const result = await db.execute<{ oldValue: string; currentValue: string }>(
      query,
    );
    return result.rows[0];
  }

  async getActiveSupply(days: DaysEnum) {
    const query = sql`
      SELECT COALESCE(SUM(ap."voting_power"), 0) as "activeSupply"
      FROM "account_power" ap
      WHERE ap."last_vote_timestamp" >= ${this.now() - days}
    `;
    const result = await db.execute<ActiveSupplyQueryResult>(query);
    return result.rows[0];
  }

  async getVotingDelay(): Promise<bigint> {
    const result = await db.query.dao.findFirst({
      columns: {
        votingDelay: true,
      },
    });

    return result!.votingDelay;
  }

  async getProposalsCompare(days: DaysEnum) {
    const query = sql`
      WITH old_proposals AS (
        SELECT COUNT(*) AS "oldProposalsLaunched"
        FROM "proposals_onchain" p
        WHERE p.timestamp <= ${this.now() - days}
      ),
      current_proposals AS (
        SELECT COUNT(*) AS "currentProposalsLaunched"
        FROM "proposals_onchain" p
      )
      SELECT * FROM current_proposals
      JOIN old_proposals ON 1=1;
    `;
    const result = await db.execute<ProposalsCompareQueryResult>(query);
    return result.rows[0];
  }

  async getVotesCompare(days: DaysEnum) {
    const query = sql`
      WITH old_votes AS (
        SELECT COUNT(*) AS "oldVotes"
        FROM "votes_onchain" v
        WHERE v.timestamp <= ${this.now() - days}
      ),
      current_votes AS (
        SELECT COUNT(*) AS "currentVotes"
        FROM "votes_onchain" v
      )
      SELECT * FROM current_votes
      JOIN old_votes ON 1=1;
    `;
    const result = await db.execute<VotesCompareQueryResult>(query);
    return result.rows[0];
  }

  async getAverageTurnoutCompare(days: DaysEnum) {
    const query = sql<AverageTurnoutCompareQueryResult>`
      WITH old_average_turnout AS (
        SELECT COALESCE(AVG(${proposalsOnchain.forVotes} + ${proposalsOnchain.againstVotes} + ${proposalsOnchain.abstainVotes}), 0) AS "oldAverageTurnout"
        FROM ${proposalsOnchain}
        WHERE ${proposalsOnchain.timestamp} <= ${this.now() - days}
        AND ${proposalsOnchain.status} != 'CANCELED'
      ),
      current_average_turnout AS (
        SELECT COALESCE(AVG(${proposalsOnchain.forVotes} + ${proposalsOnchain.againstVotes} + ${proposalsOnchain.abstainVotes}), 0) AS "currentAverageTurnout"
        FROM ${proposalsOnchain}
        WHERE ${proposalsOnchain.status} != 'CANCELED' AND ${proposalsOnchain.timestamp} >= ${this.now() - days}
      )
      SELECT * FROM current_average_turnout
      JOIN old_average_turnout ON 1=1;
    `;
    const result = await db.execute<AverageTurnoutCompareQueryResult>(query);
    return result.rows[0];
  }

  async getProposals(
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
    status: string[] | undefined,
    fromDate: number | undefined,
    fromEndDate: number | undefined,
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

    return await db
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
    return await db.query.proposalsOnchain.findFirst({
      where: eq(proposalsOnchain.id, proposalId),
    });
  }

  async getProposalsCount(): Promise<number> {
    return db.$count(proposalsOnchain);
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

  now() {
    return Math.floor(Date.now() / 1000);
  }
}
