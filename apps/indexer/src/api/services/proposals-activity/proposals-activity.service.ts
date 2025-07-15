import { Address } from "viem";
import { DaoIdEnum } from "@/lib/enums";
import {
  ProposalsActivityRepository,
  DrizzleProposalsActivityRepository,
  DbProposal,
  DbVote,
} from "@/api/repositories/proposals-activity.repository";
import { SECONDS_PER_BLOCK } from "@/lib/constants";

const FINAL_PROPOSAL_STATUSES = ["EXECUTED", "DEFEATED", "CANCELED", "EXPIRED"];

export type OrderByField =
  | "votingPower"
  | "voteTiming";
export type OrderDirection = "asc" | "desc";
export type VoteFilterType = "yes" | "no" | "abstain" | "no-vote";

export interface ProposalActivityRequest {
  address: Address;
  fromDate?: number;
  daoId: DaoIdEnum;
  skip?: number;
  limit?: number;
  orderBy?: OrderByField;
  orderDirection?: OrderDirection;
  userVoteFilter?: VoteFilterType;
}

export interface ProposalWithUserVote {
  proposal: {
    id: string;
    daoId: string;
    proposerAccountId: string;
    description: string;
    startBlock: string;
    endBlock: string;
    timestamp: string;
    status: string;
    forVotes: string;
    againstVotes: string;
    abstainVotes: string;
    proposalEndTimestamp: string;
  };
  userVote: {
    id: string;
    voterAccountId: string;
    proposalId: string;
    support: string;
    votingPower: string;
    reason: string;
    timestamp: string;
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
  constructor(private readonly repository: ProposalsActivityRepository) {}

  async getProposalsActivity({
    address,
    fromDate,
    daoId,
    skip = 0,
    limit = 10,
    orderBy = "voteTiming",
    orderDirection = "desc",
    userVoteFilter,
  }: ProposalActivityRequest): Promise<DelegateProposalActivity> {
    // Check if user has ever voted
    const firstVoteTimestamp = await this.repository.getFirstVoteTimestamp(
      address,
      daoId,
    );

    if (!firstVoteTimestamp) {
      return this.createEmptyActivity(address, true);
    }

    // Get voting period for the DAO
    const votingPeriodBlocks = await this.repository.getDaoVotingPeriod(daoId);
    const votingPeriodSeconds = votingPeriodBlocks * SECONDS_PER_BLOCK;

    // Calculate activity start time
    const activityStart = this.calculateActivityStart(
      firstVoteTimestamp,
      fromDate,
    );

    // Get proposals and votes
    const proposals = await this.repository.getProposals(
      daoId,
      activityStart,
      votingPeriodSeconds,
    );

    if (proposals.length === 0) {
      return this.createEmptyActivity(address, false);
    }

    const userVotes = await this.repository.getUserVotes(
      address,
      daoId,
      proposals.map((p: DbProposal) => p.id),
    );

    // Build response
    const proposalsWithVotes = this.buildProposalsWithVotes(
      proposals,
      userVotes,
    );

    // Apply vote filter if provided
    const filteredProposals = userVoteFilter
      ? this.filterProposalsByVote(proposalsWithVotes, userVoteFilter)
      : proposalsWithVotes;

    // Sort proposals based on the specified criteria
    const sortedProposals = this.sortProposals(
      filteredProposals,
      orderBy,
      orderDirection,
    );

    const paginatedProposals = sortedProposals.slice(skip, skip + limit);
    const analytics = this.calculateAnalytics(proposals, userVotes);

    return {
      address,
      totalProposals: proposals.length,
      votedProposals: userVotes.length,
      neverVoted: false,
      ...analytics,
      proposals: paginatedProposals,
    };
  }

  private calculateActivityStart(
    firstVoteTimestamp: number,
    fromDate?: number,
  ): number {
    return fromDate && fromDate > firstVoteTimestamp
      ? fromDate
      : firstVoteTimestamp;
  }

  private buildProposalsWithVotes(
    proposals: DbProposal[],
    userVotes: DbVote[],
  ): ProposalWithUserVote[] {
    const voteMap = new Map(userVotes.map((vote) => [vote.proposal_id, vote]));

    return proposals.map((proposal) => {
      const vote = voteMap.get(proposal.id);

      return {
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
          proposalEndTimestamp: proposal.proposal_end_timestamp,
        },
        userVote: vote
          ? {
              id: vote.id,
              voterAccountId: vote.voter_account_id,
              proposalId: vote.proposal_id,
              support: vote.support,
              votingPower: vote.voting_power,
              reason: vote.reason,
              timestamp: vote.timestamp,
            }
          : null,
      };
    });
  }

  private calculateAnalytics(proposals: DbProposal[], userVotes: DbVote[]) {
    if (userVotes.length === 0) {
      return { winRate: 0, yesRate: 0, avgTimeBeforeEnd: 0 };
    }

    // Calculate yes rate (support = "1" means "For")
    const yesVotes = userVotes.filter((vote) => vote.support === "1").length;
    const yesRate = (yesVotes / userVotes.length) * 100;

    // Calculate win rate for finished proposals only
    const { winningVotes, finishedProposalsVoted } = this.calculateWinRate(
      proposals,
      userVotes,
    );
    const winRate =
      finishedProposalsVoted > 0
        ? (winningVotes / finishedProposalsVoted) * 100
        : 0;

    // Calculate average time before end
    const avgTimeBeforeEnd = this.calculateAvgTimeBeforeEnd(
      proposals,
      userVotes,
    );

    return {
      winRate: Math.round(winRate * 100) / 100,
      yesRate: Math.round(yesRate * 100) / 100,
      avgTimeBeforeEnd, // This parameter is in seconds
    };
  }

  private calculateWinRate(proposals: DbProposal[], userVotes: DbVote[]) {
    let winningVotes = 0;
    let finishedProposalsVoted = 0;

    for (const vote of userVotes) {
      const proposal = proposals.find((p) => p.id === vote.proposal_id);

      if (!this.isFinishedProposal(proposal)) continue;

      finishedProposalsVoted++;

      const winningSide = this.getWinningSide(proposal!.status!);
      if (vote.support === winningSide) {
        winningVotes++;
      }
    }

    return { winningVotes, finishedProposalsVoted };
  }

  private isFinishedProposal(proposal: DbProposal | undefined): boolean {
    return !!(
      proposal?.status &&
      FINAL_PROPOSAL_STATUSES.includes(proposal.status.toUpperCase()) &&
      proposal.for_votes !== null &&
      proposal.against_votes !== null &&
      proposal.abstain_votes !== null
    );
  }

  private getWinningSide(status: string): string {
    const statusUpper = status.toUpperCase();
    return statusUpper === "EXECUTED" ? "1" : "0"; // "1" = For, "0" = Against
  }

  private calculateAvgTimeBeforeEnd(
    proposals: DbProposal[],
    userVotes: DbVote[],
  ): number {
    if (userVotes.length === 0) {
      return 0;
    }

    const proposalMap = new Map(proposals.map((p) => [p.id, p]));
    let totalTimeBeforeEnd = 0;
    let validVotes = 0;

    for (const vote of userVotes) {
      const proposal = proposalMap.get(vote.proposal_id);
      if (!proposal || !proposal.proposal_end_timestamp) {
        continue;
      }

      const voteTimestamp = Number(vote.timestamp);
      const proposalEndTimestamp = Number(proposal.proposal_end_timestamp);

      // Calculate time difference in seconds
      const timeBeforeEndSeconds = proposalEndTimestamp - voteTimestamp;

      // Only count positive values (votes cast before proposal ended)
      if (timeBeforeEndSeconds > 0) {
        totalTimeBeforeEnd += timeBeforeEndSeconds;
        validVotes++;
      }
    }

    return validVotes > 0 ? Math.round(totalTimeBeforeEnd / validVotes) : 0;
  }

  private createEmptyActivity(
    address: string,
    neverVoted: boolean,
  ): DelegateProposalActivity {
    return {
      address,
      totalProposals: 0,
      votedProposals: 0,
      neverVoted,
      winRate: 0,
      yesRate: 0,
      avgTimeBeforeEnd: 0,
      proposals: [],
    };
  }

  private filterProposalsByVote(
    proposals: ProposalWithUserVote[],
    userVoteFilter: VoteFilterType,
  ): ProposalWithUserVote[] {
    return proposals.filter((proposal) => {
      const userVote = proposal.userVote;

      // Check if "no-vote" filter and user didn't vote
      if (userVoteFilter === "no-vote" && !userVote) {
        return true;
      }

      // Check if user voted and the vote type matches filter
      if (userVote) {
        const support = userVote.support;

        // Map support values to filter types
        if (support === "1" && userVoteFilter === "yes") {
          return true;
        }
        if (support === "0" && userVoteFilter === "no") {
          return true;
        }
        if (support === "2" && userVoteFilter === "abstain") {
          return true;
        }
      }

      return false;
    });
  }

  private sortProposals(
    proposals: ProposalWithUserVote[],
    orderBy: OrderByField,
    orderDirection: OrderDirection,
  ): ProposalWithUserVote[] {
    return proposals.sort((a, b) => {
      let comparison = 0;

      switch (orderBy) {
        case "votingPower":
          // Sort by voting power (null votes have 0 voting power)
          const aVotingPower = a.userVote?.votingPower
            ? Number(a.userVote.votingPower)
            : 0;
          const bVotingPower = b.userVote?.votingPower
            ? Number(b.userVote.votingPower)
            : 0;
          comparison = aVotingPower - bVotingPower;
          break;

        case "voteTiming":
          // Sort by vote timing (userVote.timestamp - proposal.timestamp)
          const aVoteTime = a.userVote?.timestamp
            ? Number(a.userVote.timestamp) - Number(a.proposal.timestamp)
            : 0;
          const bVoteTime = b.userVote?.timestamp
            ? Number(b.userVote.timestamp) - Number(b.proposal.timestamp)
            : 0;
          comparison = aVoteTime - bVoteTime;
          break;

        default:
          comparison = 0;
      }

      // Apply direction
      return orderDirection === "desc" ? -comparison : comparison;
    });
  }
}
