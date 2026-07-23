import { sql } from "drizzle-orm";

import { Drizzle } from "@/database";
import { DBInactiveVotingPowerSummary } from "@/mappers";

export class InactiveVotingPowerSummaryRepository {
  constructor(private readonly db: Drizzle) {}

  /**
   * Aggregates, in a single query, the total delegated voting power and the
   * share held by delegates that cast zero votes on proposals whose voting
   * period falls within the window. Window semantics mirror the
   * proposals-activity service: a proposal is in the window when its voting
   * period (creation timestamp plus the DAO voting period) overlaps
   * [fromDate, toDate].
   */
  async getInactiveDelegatedVotingPowerSummary(
    votingPeriodSeconds: number,
    fromDate?: number,
    toDate?: number,
  ): Promise<DBInactiveVotingPowerSummary> {
    const fromFilter = fromDate
      ? sql` AND (timestamp + ${votingPeriodSeconds}) >= ${fromDate}`
      : sql``;
    const toFilter = toDate ? sql` AND timestamp <= ${toDate}` : sql``;

    const query = sql`
      WITH window_proposals AS (
        SELECT id
        FROM proposals_onchain
        WHERE TRUE${fromFilter}${toFilter}
      )
      SELECT
        (SELECT COUNT(*) FROM window_proposals) AS total_proposals,
        COALESCE(SUM(ap.voting_power), 0)::text AS total_delegated_voting_power,
        COALESCE(SUM(ap.voting_power) FILTER (
          WHERE NOT EXISTS (
            SELECT 1
            FROM votes_onchain v
            WHERE v.voter_account_id = ap.account_id
              AND v.proposal_id IN (SELECT id FROM window_proposals)
          )
        ), 0)::text AS inactive_delegated_voting_power
      FROM account_power ap
      WHERE ap.voting_power > 0
    `;

    const result = await this.db.execute<{
      total_proposals: string | number;
      total_delegated_voting_power: string;
      inactive_delegated_voting_power: string;
    }>(query);

    const row = result.rows[0];

    return {
      totalProposals: Number(row?.total_proposals ?? 0),
      totalDelegatedVotingPower: BigInt(
        row?.total_delegated_voting_power ?? "0",
      ),
      inactiveDelegatedVotingPower: BigInt(
        row?.inactive_delegated_voting_power ?? "0",
      ),
    };
  }
}
