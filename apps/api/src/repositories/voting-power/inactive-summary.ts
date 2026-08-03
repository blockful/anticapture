import { sql } from "drizzle-orm";

import { Drizzle } from "@/database";
import { DBInactiveVotingPowerSummary } from "@/mappers";

export class InactiveVotingPowerSummaryRepository {
  constructor(private readonly db: Drizzle) {}

  /**
   * Total delegated voting power and the share held by delegates that cast zero
   * votes in the window, in a single query. Window semantics mirror the
   * proposals-activity service: a proposal is in the window when its voting
   * period (creation timestamp plus the DAO voting period) overlaps it.
   */
  async getInactiveDelegatedVotingPowerSummary(
    votingPeriodSeconds: number,
    votingDelaySeconds: number,
    fromDate?: number,
    toDate?: number,
  ): Promise<DBInactiveVotingPowerSummary> {
    const fromFilter = fromDate
      ? sql` AND (timestamp + ${votingPeriodSeconds}) >= ${fromDate}`
      : sql``;
    // Keyed on when voting opens, not on creation: a proposal created inside the
    // window whose voting only opens after it takes no vote in the window, so
    // counting it would report every delegate as inactive on a proposal none of
    // them could vote on yet -- and when it is the only proposal in the window,
    // the `totalProposals === 0` guard downstream no longer catches it.
    const toFilter = toDate
      ? sql` AND (timestamp + ${votingDelaySeconds}) <= ${toDate}`
      : sql``;
    // Proposals that open near the end of the window stay votable past it, so a
    // vote cast after `toDate` must not count as activity inside the window.
    const voteToFilter = toDate ? sql` AND v.timestamp <= ${toDate}` : sql``;
    // Mirror image: a proposal whose voting period overlaps `fromDate` can also
    // have been voted on before it, and that vote is outside the window too.
    const voteFromFilter = fromDate
      ? sql` AND v.timestamp >= ${fromDate}`
      : sql``;

    const query = sql`
      WITH window_proposals AS (
        SELECT id
        FROM proposals_onchain
        WHERE UPPER(status) <> 'CANCELED'${fromFilter}${toFilter}
      )
      SELECT
        (SELECT COUNT(*) FROM window_proposals) AS total_proposals,
        COALESCE(SUM(ap.voting_power), 0)::text AS total_delegated_voting_power,
        COALESCE(SUM(ap.voting_power) FILTER (
          WHERE NOT EXISTS (
            SELECT 1
            FROM votes_onchain v
            WHERE v.voter_account_id = ap.account_id
              AND v.proposal_id IN (SELECT id FROM window_proposals)${voteFromFilter}${voteToFilter}
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
