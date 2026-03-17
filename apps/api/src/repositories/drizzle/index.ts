import {
  and,
  asc,
  desc,
  eq,
  gte,
  inArray,
  notInArray,
  sql,
  SQL,
} from "drizzle-orm";

import {
  ActiveSupplyQueryResult,
  AverageTurnoutCompareQueryResult,
  ProposalsCompareQueryResult,
  VotesCompareQueryResult,
} from "@/controllers";
import { Drizzle, proposalsOnchain } from "@/database";
import { DBProposal } from "@/mappers";

export class DrizzleRepository {
  constructor(private readonly db: Drizzle) {}

  async getSupplyComparison(metricType: string, fromDate: number) {
    const query = sql`
      WITH old_data AS (
        SELECT db.average as old_amount
        FROM dao_metrics_day_buckets db
        WHERE db."metricType" = ${metricType}
        AND db."date" <= ${fromDate}
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

    const result = await this.db.execute<{
      oldValue: string;
      currentValue: string;
    }>(query);
    return result.rows[0];
  }

  async getActiveSupply(fromDate: number) {
    const query = sql`
      SELECT COALESCE(SUM(ap."voting_power"), 0) as "activeSupply"
      FROM "account_power" ap
      WHERE ap."last_vote_timestamp" >= ${fromDate}
    `;
    const result = await this.db.execute<ActiveSupplyQueryResult>(query);
    return result.rows[0];
  }

  async getProposalsCompare(fromDate: number) {
    const query = sql`
      WITH old_proposals AS (
        SELECT COUNT(*) AS "oldProposalsLaunched"
        FROM "proposals_onchain" p
        WHERE p.timestamp <= ${fromDate}
      ),
      current_proposals AS (
        SELECT COUNT(*) AS "currentProposalsLaunched"
        FROM "proposals_onchain" p
      )
      SELECT * FROM current_proposals
      JOIN old_proposals ON 1=1;
    `;
    const result = await this.db.execute<ProposalsCompareQueryResult>(query);
    return result.rows[0];
  }

  async getVotesCompare(fromDate: number) {
    const query = sql`
      WITH old_votes AS (
        SELECT COUNT(*) AS "oldVotes"
        FROM "votes_onchain" v
        WHERE v.timestamp <= ${fromDate}
      ),
      current_votes AS (
        SELECT COUNT(*) AS "currentVotes"
        FROM "votes_onchain" v
      )
      SELECT * FROM current_votes
      JOIN old_votes ON 1=1;
    `;
    const result = await this.db.execute<VotesCompareQueryResult>(query);
    return result.rows[0];
  }

  async getAverageTurnoutCompare(fromDate: number) {
    const query = sql<AverageTurnoutCompareQueryResult>`
      WITH old_average_turnout AS (
        SELECT COALESCE(AVG(${proposalsOnchain.forVotes} + ${proposalsOnchain.againstVotes} + ${proposalsOnchain.abstainVotes}), 0) AS "oldAverageTurnout"
        FROM ${proposalsOnchain}
        WHERE ${proposalsOnchain.timestamp} <= ${fromDate}
        AND ${proposalsOnchain.status} NOT IN ('ACTIVE', 'PENDING', 'CANCELED')
      ),
      current_average_turnout AS (
        SELECT COALESCE(AVG(${proposalsOnchain.forVotes} + ${proposalsOnchain.againstVotes} + ${proposalsOnchain.abstainVotes}), 0) AS "currentAverageTurnout"
        FROM ${proposalsOnchain}
        WHERE ${proposalsOnchain.timestamp} >= ${fromDate}
        AND ${proposalsOnchain.status} NOT IN ('ACTIVE', 'PENDING', 'CANCELED')
      )
      SELECT * FROM current_average_turnout
      JOIN old_average_turnout ON 1=1;
    `;
    const result =
      await this.db.execute<AverageTurnoutCompareQueryResult>(query);
    return result.rows[0];
  }

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
        orderDirection === "asc"
          ? asc(proposalsOnchain.logIndex)
          : desc(proposalsOnchain.logIndex),
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
}
