import { and, asc, desc, eq, gte, inArray, sql } from "ponder";
import { db } from "ponder:api";
import { delegation, transfer, votingPowerHistory } from "ponder:schema";

import {
  ActiveSupplyQueryResult,
  AverageTurnoutCompareQueryResult,
  ProposalsCompareQueryResult,
  VotesCompareQueryResult,
} from "../controller/governance-activity/types";
import { DaysEnum } from "@/lib/enums";
import { DBVotingPowerHistoryWithRelations } from "../mappers";

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

  async getVotingPowers({
    blockNumber,
    limit,
    skip,
    orderBy = "timestamp",
    orderDirection = "asc",
    addresses,
  }: {
    blockNumber: number;
    limit: number;
    skip: number;
    orderBy: "timestamp" | "delta";
    orderDirection: "asc" | "desc";
    addresses?: string[];
  }): Promise<DBVotingPowerHistoryWithRelations[]> {
    const orderDirectionFn = orderDirection === "asc" ? asc : desc;

    const whereConditions = [
      gte(votingPowerHistory.timestamp, BigInt(blockNumber)),
    ];

    if (addresses) {
      whereConditions.push(inArray(votingPowerHistory.accountId, addresses));
    }

    const result = await db
      .select()
      .from(votingPowerHistory)
      .leftJoin(
        transfer,
        and(
          eq(votingPowerHistory.transactionHash, transfer.transactionHash),
          eq(votingPowerHistory.deltaMod, transfer.amount),
        ),
      )
      .leftJoin(
        delegation,
        and(
          eq(votingPowerHistory.transactionHash, delegation.transactionHash),
          eq(votingPowerHistory.deltaMod, delegation.delegatedValue),
        ),
      )
      .where(and(...whereConditions))
      .orderBy(orderDirectionFn(votingPowerHistory[orderBy]))
      .limit(limit)
      .offset(skip);

    return result.map((row) => ({
      ...row.voting_power_history,
      transfers: row.transfers ? [row.transfers] : [],
      delegations: row.delegations ? [row.delegations] : [],
    }));
  }

  now() {
    return Math.floor(Date.now() / 1000);
  }
}
