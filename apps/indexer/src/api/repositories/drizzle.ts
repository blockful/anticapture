import { and, asc, desc, eq, gte, inArray, lte, sql } from "ponder";
import { db } from "ponder:api";
import { proposalsOnchain, votingPowerHistory } from "ponder:schema";
import { Address } from "viem";
import { SQL } from "drizzle-orm";

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
    const query = sql`
      WITH old_average_turnout AS (
        SELECT AVG(po."for_votes" + po."against_votes" + po."abstain_votes") AS "oldAverageTurnout"
        FROM "proposals_onchain" po
        WHERE po.timestamp <= ${this.now() - days}
        AND po.status != 'CANCELED'
      ),
      current_average_turnout AS (
        SELECT AVG(po."for_votes" + po."against_votes" + po."abstain_votes") AS "currentAverageTurnout"
        FROM "proposals_onchain" po
        WHERE po.status != 'CANCELED'
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
  ): Promise<DBProposal[]> {
    const whereClauses: SQL<unknown>[] = [];

    if (status && status.length > 0) {
      whereClauses.push(inArray(proposalsOnchain.status, status));
    }

    if (fromDate) {
      whereClauses.push(gte(proposalsOnchain.timestamp, BigInt(fromDate)));
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

  async getVotingPower(
    addresses: Address[],
    timestamp: bigint,
  ): Promise<{ address: Address; votingPower: bigint }[]> {
    return await db
      .selectDistinctOn([votingPowerHistory.accountId], {
        address: votingPowerHistory.accountId,
        votingPower: votingPowerHistory.votingPower,
      })
      .from(votingPowerHistory)
      .where(
        and(
          inArray(votingPowerHistory.accountId, addresses),
          lte(votingPowerHistory.timestamp, timestamp),
        ),
      )
      .orderBy(
        votingPowerHistory.accountId,
        desc(votingPowerHistory.timestamp),
      );
  }

  now() {
    return Math.floor(Date.now() / 1000);
  }
}
