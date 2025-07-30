import { Address } from "viem";
import { DaoIdEnum } from "@/lib/enums";
import { eq, sql } from "ponder";
import { db } from "ponder:api";
import { accountPower, dao } from "ponder:schema";

export type DbProposal = {
  id: string;
  dao_id: string;
  proposer_account_id: string;
  description: string;
  start_block: string;
  end_block: string;
  timestamp: string;
  status: string;
  for_votes: string;
  against_votes: string;
  abstain_votes: string;
  proposal_end_timestamp: string;
};

export type DbVote = {
  id: string;
  voter_account_id: string;
  proposal_id: string;
  support: string;
  voting_power: string;
  reason: string;
  timestamp: string;
};

export type DbProposalWithVote = {
  proposal: DbProposal;
  userVote: DbVote | null;
};

export enum VoteFilter {
  YES = "yes",
  NO = "no",
  ABSTAIN = "abstain",
  NO_VOTE = "no_vote",
}
export type OrderByField = "votingPower" | "voteTiming" | "timestamp";
export type OrderDirection = "asc" | "desc";

export interface ProposalsActivityRepository {
  getFirstVoteTimestamp(address: Address): Promise<number | null>;

  getDaoVotingPeriod(daoId: DaoIdEnum): Promise<number | undefined>;

  getProposals(
    daoId: DaoIdEnum,
    activityStart: number,
    votingPeriodSeconds: number,
  ): Promise<DbProposal[]>;

  getUserVotes(
    address: Address,
    daoId: DaoIdEnum,
    proposalIds: string[],
  ): Promise<DbVote[]>;

  getProposalsWithVotesAndPagination(
    address: Address,
    activityStart: number,
    votingPeriodSeconds: number,
    skip: number,
    limit: number,
    orderBy: OrderByField,
    orderDirection: OrderDirection,
    userVoteFilter?: VoteFilter,
  ): Promise<{
    proposals: DbProposalWithVote[];
    totalCount: number;
  }>;
}

export class DrizzleProposalsActivityRepository
  implements ProposalsActivityRepository
{
  async getFirstVoteTimestamp(address: Address): Promise<number | null> {
    const account = await db.query.accountPower.findFirst({
      where: eq(accountPower.accountId, address),
      columns: {
        firstVoteTimestamp: true,
      },
    });
    return account?.firstVoteTimestamp
      ? Number(account.firstVoteTimestamp)
      : null;
  }

  async getDaoVotingPeriod(daoId: DaoIdEnum): Promise<number | undefined> {
    const _dao = await db.query.dao.findFirst({
      where: eq(dao.id, daoId),
      columns: {
        votingPeriod: true,
      },
    });
    return _dao?.votingPeriod ? Number(_dao.votingPeriod) : undefined;
  }

  async getProposals(
    daoId: DaoIdEnum,
    activityStart: number,
    votingPeriodSeconds: number,
  ): Promise<DbProposal[]> {
    const query = sql`
      SELECT id, dao_id, proposer_account_id, description, start_block, end_block, 
             timestamp, status, for_votes, against_votes, abstain_votes,
             (timestamp + ${votingPeriodSeconds}) as proposal_end_timestamp
      FROM proposals_onchain
      WHERE (timestamp + ${votingPeriodSeconds}) >= ${activityStart}
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
      SELECT tx_hash as id, voter_account_id, proposal_id, support, voting_power, reason, timestamp
      FROM votes_onchain
      WHERE voter_account_id = ${address}
        AND dao_id = ${daoId}
        AND proposal_id IN (${sql.raw(proposalIds.map((id) => `'${id}'`).join(","))})
    `;

    const result = await db.execute<DbVote>(query);
    return result.rows;
  }

  async getProposalsWithVotesAndPagination(
    address: Address,
    activityStart: number,
    votingPeriodSeconds: number,
    skip: number,
    limit: number,
    orderBy: OrderByField,
    orderDirection: OrderDirection,
    userVoteFilter?: VoteFilter,
  ): Promise<{
    proposals: DbProposalWithVote[];
    totalCount: number;
  }> {
    // Build the vote filter condition
    let voteFilterCondition = "";
    if (userVoteFilter) {
      switch (userVoteFilter) {
        case VoteFilter.YES:
          voteFilterCondition = "AND v.support = '1'";
          break;
        case VoteFilter.NO:
          voteFilterCondition = "AND v.support = '0'";
          break;
        case VoteFilter.ABSTAIN:
          voteFilterCondition = "AND v.support = '2'";
          break;
        case VoteFilter.NO_VOTE:
          voteFilterCondition = "AND v.support IS NULL";
          break;
      }
    }

    // Build the ORDER BY clause
    let orderByClause = "";
    switch (orderBy) {
      case "votingPower":
        orderByClause = `ORDER BY COALESCE(v.voting_power, '0')::numeric ${orderDirection.toUpperCase()}`;
        break;
      case "voteTiming":
        // Sort by how much time elapsed between proposal launch and user vote
        // For proposals without votes, use a large number to put them at the end
        orderByClause = `ORDER BY COALESCE(v.timestamp - p.timestamp, 999999999) ${orderDirection.toUpperCase()}`;
        break;
      default:
        orderByClause = `ORDER BY p.timestamp ${orderDirection.toUpperCase()}`;
    }

    // Main query with LEFT JOIN to get proposals and their votes
    const query = sql`
      SELECT 
        p.id, p.dao_id, p.proposer_account_id, p.description, p.start_block, p.end_block,
        p.timestamp, p.status, p.for_votes, p.against_votes, p.abstain_votes,
        (p.timestamp + ${votingPeriodSeconds}) as proposal_end_timestamp,
        v.tx_hash as vote_id, v.voter_account_id, v.proposal_id, v.support, v.voting_power, v.reason, v.timestamp as vote_timestamp
      FROM proposals_onchain p
      LEFT JOIN votes_onchain v ON p.id = v.proposal_id AND v.voter_account_id = ${address}
      WHERE (p.timestamp + ${votingPeriodSeconds}) >= ${activityStart}
        ${sql.raw(voteFilterCondition)}
      ${sql.raw(orderByClause)}
      LIMIT ${limit} OFFSET ${skip}
    `;

    // Count query for total results
    const countQuery = sql`
      SELECT COUNT(*) as total_count
      FROM proposals_onchain p
      LEFT JOIN votes_onchain v ON p.id = v.proposal_id AND v.voter_account_id = ${address}
      WHERE (p.timestamp + ${votingPeriodSeconds}) >= ${activityStart}
        ${sql.raw(voteFilterCondition)}
    `;

    const [result, countResult] = await Promise.all([
      db.execute<{
        id: string;
        dao_id: string;
        proposer_account_id: string;
        description: string;
        start_block: string;
        end_block: string;
        timestamp: string;
        status: string;
        for_votes: string;
        against_votes: string;
        abstain_votes: string;
        proposal_end_timestamp: string;
        vote_id: string | null;
        voter_account_id: string | null;
        proposal_id: string | null;
        support: string | null;
        voting_power: string | null;
        reason: string | null;
        vote_timestamp: string | null;
      }>(query),
      db.execute<{ total_count: string }>(countQuery),
    ]);

    const totalCount = Number(countResult.rows[0]?.total_count || 0);

    // Transform the results to match the expected format
    const proposals: DbProposalWithVote[] = result.rows.map((row) => ({
      proposal: {
        id: row.id,
        dao_id: row.dao_id,
        proposer_account_id: row.proposer_account_id,
        description: row.description,
        start_block: row.start_block,
        end_block: row.end_block,
        timestamp: row.timestamp,
        status: row.status,
        for_votes: row.for_votes,
        against_votes: row.against_votes,
        abstain_votes: row.abstain_votes,
        proposal_end_timestamp: row.proposal_end_timestamp,
      },
      userVote: row.vote_id
        ? {
            id: row.vote_id,
            voter_account_id: row.voter_account_id!,
            proposal_id: row.proposal_id!,
            support: row.support!,
            voting_power: row.voting_power!,
            reason: row.reason!,
            timestamp: row.vote_timestamp!,
          }
        : null,
    }));

    return {
      proposals,
      totalCount,
    };
  }
}
