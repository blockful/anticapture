import { sql } from "ponder";
import { db } from "ponder:api";

export class DrizzleRepository {
  async getSupplyComparison(
    daoId: string,
    metricType: string,
    oldTimestamp: bigint,
  ): Promise<{ oldValue: string; currentValue: string }> {
    const query = sql`
      WITH old_data AS (
        SELECT db.average as old_amount
        FROM dao_metrics_day_buckets db
        WHERE db.dao_id = ${daoId}
        AND db."metricType" = ${metricType}
        AND db."date" >= CAST(${oldTimestamp.toString().slice(0, 10)} as bigint)
        ORDER BY db."date" ASC LIMIT 1
      ),
      current_data AS (
        SELECT db.average as current_amount
        FROM dao_metrics_day_buckets db
        WHERE db.dao_id = ${daoId}
        AND db."metricType" = ${metricType}
        ORDER BY db."date" DESC LIMIT 1
      )
      SELECT COALESCE(old_data.old_amount, 0) AS oldValue,
             COALESCE(current_data.current_amount, 0) AS currentValue
      FROM current_data
      LEFT JOIN old_data ON 1=1;
    `;

    const result = await db.execute(query);
    return result.rows[0] as { oldValue: string; currentValue: string };
  }

  async getActiveSupply(daoId: string, since: number) {
    const query = sql`
      SELECT COALESCE(SUM(ap."voting_power"), 0) as "activeSupply"
      FROM "account_power" ap
      WHERE ap."last_vote_timestamp" > CAST(${since.toString().slice(0, 10)} as bigint)
      AND ap."dao_id" = ${daoId};
    `;
    const result = await db.execute(query);
    return result.rows[0] as { activeSupply: string };
  }

  async getProposalsCompare(daoId: string, days: number) {
    const oldBegin = BigInt(Date.now()) - BigInt(days);
    const oldEnd = BigInt(Date.now());
    const currentBegin = BigInt(Date.now()) - BigInt(days);
    const query = sql`
      WITH old_proposals AS (
        SELECT COUNT(*) AS "oldProposalsLaunched"
        FROM "proposals_onchain" p
        WHERE p.dao_id = ${daoId}
        AND p.timestamp BETWEEN CAST(${oldBegin.toString().slice(0, 10)} as bigint)
        AND CAST(${oldEnd.toString().slice(0, 10)} as bigint)
      ),
      current_proposals AS (
        SELECT COUNT(*) AS "currentProposalsLaunched"
        FROM "proposals_onchain" p
        WHERE p.dao_id = ${daoId}
        AND p.timestamp > CAST(${currentBegin.toString().slice(0, 10)} as bigint)
      )
      SELECT * FROM current_proposals
      JOIN old_proposals ON 1=1;
    `;
    const result = await db.execute(query);
    return result.rows[0] as {
      oldProposalsLaunched: string;
      currentProposalsLaunched: string;
    };
  }

  async getVotesCompare(daoId: string, days: number) {
    const oldBegin = BigInt(Date.now()) - BigInt(days);
    const oldEnd = BigInt(Date.now());
    const currentBegin = BigInt(Date.now()) - BigInt(days);
    const query = sql`
      WITH old_votes AS (
        SELECT COUNT(*) AS "oldVotes"
        FROM "votes_onchain" v
        WHERE v.dao_id = ${daoId}
        AND v.timestamp BETWEEN ${oldBegin} AND ${oldEnd}
      ),
      current_votes AS (
        SELECT COUNT(*) AS "currentVotes"
        FROM "votes_onchain" v
        WHERE v.dao_id = ${daoId}
        AND v.timestamp > ${currentBegin}
      )
      SELECT * FROM current_votes
      JOIN old_votes ON 1=1;
    `;
    const result = await db.execute(query);
    return result.rows[0] as {
      oldVotes: string;
      currentVotes: string;
    };
  }

  async getAverageTurnoutCompare(daoId: string, days: number) {
    const oldBegin = BigInt(Date.now()) - BigInt(days);
    const oldEnd = BigInt(Date.now());
    const currentBegin = BigInt(Date.now()) - BigInt(days);
    const currentEnd = BigInt(Date.now());
    const query = sql`
      WITH old_average_turnout AS (
        SELECT AVG(po."for_votes" + po."against_votes" + po."abstain_votes") AS "oldAverageTurnout"
        FROM "proposals_onchain" po
        WHERE po.timestamp BETWEEN ${oldBegin} AND ${oldEnd}
        AND po.status != 'CANCELED'
        AND po.dao_id = ${daoId}
      ),
      current_average_turnout AS (
        SELECT AVG(po."for_votes" + po."against_votes" + po."abstain_votes") AS "currentAverageTurnout"
        FROM "proposals_onchain" po
        WHERE po.timestamp BETWEEN ${currentBegin} AND ${currentEnd}
        AND po.status != 'CANCELED'
        AND po.dao_id = ${daoId}
      )
      SELECT * FROM current_average_turnout
      JOIN old_average_turnout ON 1=1;
    `;
    const result = await db.execute(query);
    return result.rows[0] as {
      oldAverageTurnout: string;
      currentAverageTurnout: string;
    };
  }
}
