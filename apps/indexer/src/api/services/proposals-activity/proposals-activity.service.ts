import { Address } from "viem";
import { DaoIdEnum } from "@/lib/enums";
import { sql } from "ponder";
import { db } from "ponder:api";

export interface ProposalActivityRequest {
  address: Address;
  fromDate?: number;
  daoId: DaoIdEnum;
  skip?: number;
  limit?: number;
}

export interface ProposalWithUserVote {
  proposal: {
    id: string;
    daoId: string;
    proposerAccountId: string;
    description: string | null;
    startBlock: string | null;
    endBlock: string | null;
    timestamp: string | null;
    status: string | null;
    forVotes: string | null;
    againstVotes: string | null;
    abstainVotes: string | null;
  };
  userVote: {
    id: string;
    voterAccountId: string;
    proposalId: string;
    support: string | null;
    votingPower: string | null;
    reason: string | null;
    timestamp: string | null;
  } | null;
}

export interface DelegateProposalActivity {
  address: string;
  totalProposals: number;
  votedProposals: number;
  neverVoted: boolean;
  winRate: number;
  yesRate: number;
  avgTimeBeforeEnd: number;
  proposals: ProposalWithUserVote[];
}

export class ProposalsActivityService {
  /**
   * Get proposal activity data for a single delegate
   */
  async getProposalsActivity({
    address,
    fromDate,
    daoId,
    skip = 0,
    limit = 10,
  }: ProposalActivityRequest): Promise<DelegateProposalActivity> {
    return await this.getActivityForAddress(
      address,
      fromDate,
      daoId,
      skip,
      limit
    );
  }

  /**
   * Get proposal activity for a single address
   */
  private async getActivityForAddress(
    address: Address,
    fromDate: number | undefined,
    daoId: DaoIdEnum,
    skip: number = 0,
    limit: number = 10
  ): Promise<DelegateProposalActivity> {
    // Get the DAO voting period to calculate proposal end times
    const daoQuery = sql`
      SELECT voting_period
      FROM dao
      WHERE id = ${daoId}
      LIMIT 1
    `;

    const daoResult = await db.execute<{
      voting_period: string;
    }>(daoQuery);
    const votingPeriodBlocks = daoResult.rows[0]?.voting_period;

    if (!votingPeriodBlocks) {
      throw new Error(`DAO ${daoId} not found or missing voting period`);
    }

    // Get the first vote timestamp for this address
    const firstVoteQuery = sql`
      SELECT first_vote_timestamp
      FROM account_power
      WHERE account_id = ${address} AND dao_id = ${daoId}
      LIMIT 1
    `;

    const firstVoteResult = await db.execute<{
      first_vote_timestamp: string | null;
    }>(firstVoteQuery);
    const firstVoteTimestamp = firstVoteResult.rows[0]?.first_vote_timestamp;

    if (!firstVoteTimestamp) {
      // User has never voted, return empty activity
      return {
        address,
        totalProposals: 0,
        votedProposals: 0,
        neverVoted: true,
        winRate: 0,
        yesRate: 0,
        avgTimeBeforeEnd: 0,
        proposals: [],
      };
    }

    const firstVoteTs = Number(firstVoteTimestamp);

    // Calculate activity start time
    // If fromDate is provided and it's after the first vote, use fromDate
    // Otherwise, use the first vote timestamp as the start
    let activityStart = firstVoteTs;
    if (fromDate && fromDate > firstVoteTs) {
      activityStart = fromDate;
    }

    // Get all proposals where the voting period overlapped with the user's activity period
    // A proposal is available for voting from timestamp to timestamp + voting_period_seconds
    // We assume 1 block = 12 seconds for timestamp calculation (Ethereum average)
    const votingPeriodSeconds = Number(votingPeriodBlocks) * 12;

    // Find proposals where:
    // proposal_end_time = timestamp + voting_period_seconds
    // proposal_end_time >= activityStart (proposal was still votable when user became active)
    const proposalsQuery = sql`
      SELECT id, dao_id, proposer_account_id, description, start_block, end_block, 
             timestamp, status, for_votes, against_votes, abstain_votes,
             (timestamp + ${votingPeriodSeconds}) as proposal_end_timestamp
      FROM proposals_onchain
      WHERE dao_id = ${daoId}
        AND (timestamp + ${votingPeriodSeconds}) >= ${activityStart}
      ORDER BY timestamp DESC
    `;

    const proposalsResult = await db.execute<{
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
    }>(proposalsQuery);

    const proposals = proposalsResult.rows;

    if (proposals.length === 0) {
      return {
        address,
        totalProposals: 0,
        votedProposals: 0,
        neverVoted: false,
        winRate: 0,
        yesRate: 0,
        avgTimeBeforeEnd: 0,
        proposals: [],
      };
    }

    // Get user's votes for these proposals
    const proposalIds = proposals.map((p) => p.id);

    const userVotesQuery = sql`
      SELECT id, voter_account_id, proposal_id, support, voting_power, reason, timestamp
      FROM votes_onchain
      WHERE voter_account_id = ${address}
        AND dao_id = ${daoId}
        AND proposal_id IN (${sql.raw(proposalIds.map((id) => `'${id}'`).join(","))})
    `;

    const userVotesResult = await db.execute<{
      id: string;
      voter_account_id: string;
      proposal_id: string;
      support: string | null;
      voting_power: string | null;
      reason: string | null;
      timestamp: string | null;
    }>(userVotesQuery);

    const userVotes = userVotesResult.rows;

    // Create a map of proposalId -> vote for quick lookup
    const voteMap = new Map(userVotes.map((vote) => [vote.proposal_id, vote]));

    // Build proposals with user votes
    const allProposalsWithVotes: ProposalWithUserVote[] = proposals.map(
      (proposal) => ({
        proposal: {
          id: proposal.id,
          daoId: proposal.dao_id,
          proposerAccountId: proposal.proposer_account_id,
          description: proposal.description,
          startBlock: proposal.start_block,
          endBlock: proposal.end_block,
          timestamp: proposal.timestamp,
          status: proposal.status,
          forVotes: proposal.for_votes,
          againstVotes: proposal.against_votes,
          abstainVotes: proposal.abstain_votes,
        },
        userVote: voteMap.get(proposal.id)
          ? {
              id: voteMap.get(proposal.id)!.id,
              voterAccountId: voteMap.get(proposal.id)!.voter_account_id,
              proposalId: voteMap.get(proposal.id)!.proposal_id,
              support: voteMap.get(proposal.id)!.support,
              votingPower: voteMap.get(proposal.id)!.voting_power,
              reason: voteMap.get(proposal.id)!.reason,
              timestamp: voteMap.get(proposal.id)!.timestamp,
            }
          : null,
      })
    );

    // Apply pagination to the proposals array
    const proposalsWithVotes = allProposalsWithVotes.slice(skip, skip + limit);

    // Calculate analytics
    const votedProposals = userVotes.length;
    const totalProposals = proposals.length;
    const neverVoted = votedProposals === 0;

    let winRate = 0;
    let yesRate = 0;
    let avgTimeBeforeEnd = 0;

    if (votedProposals > 0) {
      // Calculate yes rate (support = "1" means "For")
      const yesVotes = userVotes.filter((vote) => vote.support === "1").length;
      yesRate = (yesVotes / votedProposals) * 100;

      // Calculate win rate - only consider proposals with final status
      // Final statuses: "EXECUTED", "DEFEATED", "CANCELED", "EXPIRED" (case-insensitive)
      // "PENDING" and "ACTIVE" should not count towards winRate
      const finalStatuses = ["EXECUTED", "DEFEATED", "CANCELED", "EXPIRED"];

      let winningVotes = 0;
      let finishedProposalsVoted = 0;

      for (const vote of userVotes) {
        const proposal = proposals.find((p) => p.id === vote.proposal_id);
        if (
          proposal &&
          proposal.status &&
          finalStatuses.includes(proposal.status.toUpperCase()) &&
          proposal.for_votes !== null &&
          proposal.against_votes !== null &&
          proposal.abstain_votes !== null
        ) {
          finishedProposalsVoted++;

          // Determine winning side based on proposal outcome/status
          // In governance, the "winning side" is determined by whether the proposal passed or failed
          let winningSide = "0"; // Default to "Against" (proposal failed)

          const statusUpper = proposal.status.toUpperCase();
          if (statusUpper === "EXECUTED") {
            // Proposal passed - FOR side won
            winningSide = "1";
          } else if (
            statusUpper === "DEFEATED" ||
            statusUpper === "CANCELED" ||
            statusUpper === "EXPIRED"
          ) {
            // Proposal failed - AGAINST side won
            winningSide = "0";
          }

          const userWon = vote.support === winningSide;
          if (userWon) {
            winningVotes++;
          }
        }
      }

      // Only calculate winRate if user voted on finished proposals
      winRate =
        finishedProposalsVoted > 0
          ? (winningVotes / finishedProposalsVoted) * 100
          : 0;

      // Calculate average time before end
      // This is tricky since we need to convert block numbers to timestamps
      // For now, we'll skip this calculation and return 0
      // TODO: Implement proper block-to-timestamp conversion
      avgTimeBeforeEnd = 0;
    }

    return {
      address,
      totalProposals,
      votedProposals,
      neverVoted,
      winRate: Math.round(winRate * 100) / 100, // Round to 2 decimal places
      yesRate: Math.round(yesRate * 100) / 100,
      avgTimeBeforeEnd: Math.round(avgTimeBeforeEnd * 100) / 100,
      proposals: proposalsWithVotes,
    };
  }
}
