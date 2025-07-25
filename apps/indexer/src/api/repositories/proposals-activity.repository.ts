import { Address } from "viem";
import { DaoIdEnum } from "@/lib/enums";
import { eq, gte } from "ponder";
import { db } from "ponder:api";
import { accountPower, dao, proposalsOnchain } from "ponder:schema";

import {
  DbProposalWithVote,
  VoteFilter,
  OrderByField,
  OrderDirection,
} from "@/api/mappers";

export interface ProposalsActivityRepository {
  getFirstVoteTimestamp(address: Address): Promise<bigint | null>;

  getDaoVotingPeriod(daoId: DaoIdEnum): Promise<number | undefined>;

  getProposals(
    activityStart: bigint,
    votingPeriodSeconds: number,
  ): Promise<(DbProposalWithVote & { proposalEndTimestamp: bigint })[]>;

  getProposalsWithVotesAndPagination(
    address: Address,
    activityStart: bigint,
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
  async getFirstVoteTimestamp(address: Address): Promise<bigint | null> {
    const account = await db.query.accountPower.findFirst({
      where: eq(accountPower.accountId, address),
      columns: {
        firstVoteTimestamp: true,
      },
    });
    return account?.firstVoteTimestamp ? account.firstVoteTimestamp : null;
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
    activityStart: bigint,
    votingPeriodSeconds: number,
  ): Promise<(DbProposalWithVote & { proposalEndTimestamp: bigint })[]> {
    const proposals = await db.query.proposalsOnchain.findMany({
      where: gte(proposalsOnchain.timestamp, activityStart),
      with: {
        votes: true,
      },
    });

    return proposals.map((proposal) => ({
      ...proposal,
      proposalEndTimestamp: proposal.timestamp + BigInt(votingPeriodSeconds),
    }));
  }

  async getProposalsWithVotesAndPagination(
    _: Address,
    __: bigint,
    ___: number,
    ____: number,
    _____: number,
    ______: OrderByField,
    _______: OrderDirection,
    ________: VoteFilter,
  ): Promise<{
    proposals: DbProposalWithVote[];
    totalCount: number;
  }> {
    // // Build the vote filter condition
    // let voteFilterCondition = "";
    // if (userVoteFilter) {
    //   switch (userVoteFilter) {
    //     case VoteFilter.YES:
    //       voteFilterCondition = "AND v.support = '1'";
    //       break;
    //     case VoteFilter.NO:
    //       voteFilterCondition = "AND v.support = '0'";
    //       break;
    //     case VoteFilter.ABSTAIN:
    //       voteFilterCondition = "AND v.support = '2'";
    //       break;
    //     case VoteFilter.NO_VOTE:
    //       voteFilterCondition = "AND v.support IS NULL";
    //       break;
    //   }
    // }
    // // Build the ORDER BY clause
    // let orderByClause = "";
    // switch (orderBy) {
    //   case "votingPower":
    //     orderByClause = `ORDER BY COALESCE(v.voting_power, '0')::numeric ${orderDirection.toUpperCase()}`;
    //     break;
    //   case "voteTiming":
    //     // Sort by how much time elapsed between proposal launch and user vote
    //     // For proposals without votes, use a large number to put them at the end
    //     orderByClause = `ORDER BY COALESCE(v.timestamp - p.timestamp, 999999999) ${orderDirection.toUpperCase()}`;
    //     break;
    //   default:
    //     orderByClause = `ORDER BY p.timestamp ${orderDirection.toUpperCase()}`;
    // }
    // // Main query with LEFT JOIN to get proposals and their votes
    // const query = sql`
    //   SELECT
    //     p.id, p.dao_id, p.proposer_account_id, p.description, p.start_block, p.end_block,
    //     p.timestamp, p.status, p.for_votes, p.against_votes, p.abstain_votes,
    //     (p.timestamp + ${votingPeriodSeconds}) as proposal_end_timestamp,
    //     v.tx_hash as vote_id, v.voter_account_id, v.proposal_id, v.support, v.voting_power, v.reason, v.timestamp as vote_timestamp
    //   FROM proposals_onchain p
    //   LEFT JOIN votes_onchain v ON p.id = v.proposal_id AND v.voter_account_id = ${address}
    //   WHERE (p.timestamp + ${votingPeriodSeconds}) >= ${activityStart}
    //     ${sql.raw(voteFilterCondition)}
    //   ${sql.raw(orderByClause)}
    //   LIMIT ${limit} OFFSET ${skip}
    // `;
    // // Count query for total results
    // const countQuery = sql`
    //   SELECT COUNT(*) as total_count
    //   FROM proposals_onchain p
    //   LEFT JOIN votes_onchain v ON p.id = v.proposal_id AND v.voter_account_id = ${address}
    //   WHERE (p.timestamp + ${votingPeriodSeconds}) >= ${activityStart}
    //     ${sql.raw(voteFilterCondition)}
    // `;
    // return {
    //   proposals: result.rows,
    //   totalCount: Number(countResult.rows[0]?.total_count || 0),
    // };
    return {
      proposals: [],
      totalCount: 0,
    };
  }
}
