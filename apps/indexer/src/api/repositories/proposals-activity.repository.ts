import { Address } from "viem";
import { DaoIdEnum } from "@/lib/enums";
import { sql } from "ponder";
import { db } from "ponder:api";

// Constants
const SECONDS_PER_BLOCK = 12; // Ethereum average

export type DbProposal = {
  id: string;
  dao_id: string;
  proposer_account_id: string;
  description: string | null;
  start_block: string | null;
  end_block: string | null;
  timestamp: string | null;
  status: string | null;
  for_votes: string | null;
  against_votes: string | null;
  abstain_votes: string | null;
  proposal_end_timestamp: string;
};

export type DbVote = {
  id: string;
  voter_account_id: string;
  proposal_id: string;
  support: string | null;
  voting_power: string | null;
  reason: string | null;
  timestamp: string | null;
};

export class ProposalsActivityRepository {
  async getFirstVoteTimestamp(
    address: Address,
    daoId: DaoIdEnum,
  ): Promise<number | null> {
    const query = sql`
      SELECT first_vote_timestamp
      FROM account_power
      WHERE account_id = ${address} AND dao_id = ${daoId}
      LIMIT 1
    `;

    const result = await db.execute<{ first_vote_timestamp: string | null }>(
      query,
    );
    const timestamp = result.rows[0]?.first_vote_timestamp;

    return timestamp ? Number(timestamp) : null;
  }

  async getDaoVotingPeriod(daoId: DaoIdEnum): Promise<number> {
    const query = sql`
      SELECT voting_period
      FROM dao
      WHERE id = ${daoId}
      LIMIT 1
    `;

    const result = await db.execute<{ voting_period: string }>(query);
    const votingPeriod = result.rows[0]?.voting_period;

    if (!votingPeriod) {
      throw new Error(`DAO ${daoId} not found or missing voting period`);
    }

    return Number(votingPeriod);
  }

  async getProposals(
    daoId: DaoIdEnum,
    activityStart: number,
    votingPeriodBlocks: number,
  ): Promise<DbProposal[]> {
    const votingPeriodSeconds = votingPeriodBlocks * SECONDS_PER_BLOCK;

    const query = sql`
      SELECT id, dao_id, proposer_account_id, description, start_block, end_block, 
             timestamp, status, for_votes, against_votes, abstain_votes,
             (timestamp + ${votingPeriodSeconds}) as proposal_end_timestamp
      FROM proposals_onchain
      WHERE dao_id = ${daoId}
        AND (timestamp + ${votingPeriodSeconds}) >= ${activityStart}
      ORDER BY timestamp DESC
    `;

    const result = await db.execute<DbProposal>(query);
    return result.rows;
  }

  async getUserVotes(
    address: Address,
    daoId: DaoIdEnum,
    proposalIds: string[],
  ): Promise<DbVote[]> {
    if (proposalIds.length === 0) return [];

    const query = sql`
      SELECT id, voter_account_id, proposal_id, support, voting_power, reason, timestamp
      FROM votes_onchain
      WHERE voter_account_id = ${address}
        AND dao_id = ${daoId}
        AND proposal_id IN (${sql.raw(proposalIds.map((id) => `'${id}'`).join(","))})
    `;

    const result = await db.execute<DbVote>(query);
    return result.rows;
  }
}
