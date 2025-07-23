import { Address } from "viem";
import { DaoIdEnum } from "@/lib/enums";
import {
  ProposalsActivityRepository,
  DbProposal,
  DbVote,
} from "@/api/repositories/proposals-activity.repository";

const FINAL_PROPOSAL_STATUSES = ["EXECUTED", "DEFEATED", "CANCELED", "EXPIRED"];

export enum VoteFilter {
  YES = "yes",
  NO = "no",
  ABSTAIN = "abstain",
  NO_VOTE = "no_vote",
}

export type OrderByField = "votingPower" | "voteTiming";
export type OrderDirection = "asc" | "desc";

export interface ProposalActivityRequest {
  address: Address;
  fromDate?: number;
  daoId: DaoIdEnum;
  skip?: number;
  limit?: number;
  blockTime: number;
  orderBy?: OrderByField;
  orderDirection?: OrderDirection;
  userVoteFilter?: VoteFilter;
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
  totalProposals: number; // This will be the filtered count for pagination
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
    blockTime,
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
    const votingPeriodSeconds = votingPeriodBlocks * blockTime;

    // Calculate activity start time
    const activityStart = this.calculateActivityStart(
      firstVoteTimestamp,
      fromDate,
    );

    // Get proposals with votes, filtering, sorting, and pagination in SQL
    const { proposals: proposalsWithVotes, totalCount } =
      await this.repository.getProposalsWithVotesAndPagination(
        address,
        activityStart,
        votingPeriodSeconds,
        skip,
        limit,
        orderBy,
        orderDirection,
        userVoteFilter,
      );

    if (proposalsWithVotes.length === 0) {
      return this.createEmptyActivity(address, false);
    }

    // Transform to the expected format
    const proposals = proposalsWithVotes.map((item) => ({
      proposal: {
        id: item.proposal.id,
        daoId: item.proposal.dao_id,
        proposerAccountId: item.proposal.proposer_account_id,
        description: item.proposal.description,
        startBlock: item.proposal.start_block,
        endBlock: item.proposal.end_block,
        timestamp: item.proposal.timestamp,
        status: item.proposal.status,
        forVotes: item.proposal.for_votes,
        againstVotes: item.proposal.against_votes,
        abstainVotes: item.proposal.abstain_votes,
        proposalEndTimestamp: item.proposal.proposal_end_timestamp,
      },
      userVote: item.userVote
        ? {
            id: item.userVote.id,
            voterAccountId: item.userVote.voter_account_id,
            proposalId: item.userVote.proposal_id,
            support: item.userVote.support,
            votingPower: item.userVote.voting_power,
            reason: item.userVote.reason,
            timestamp: item.userVote.timestamp,
          }
        : null,
    }));

    // Calculate analytics (we still need this for the metrics)
    const allProposals = await this.repository.getProposals(
      daoId,
      activityStart,
      votingPeriodSeconds,
    );
    const allUserVotes = await this.repository.getUserVotes(
      address,
      daoId,
      allProposals.map((p: DbProposal) => p.id),
    );
    const analytics = this.calculateAnalytics(allProposals, allUserVotes);

    return {
      address,
      totalProposals: totalCount, // Use filtered count for pagination
      votedProposals: allUserVotes.length, // Total votes for metrics
      neverVoted: false,
      ...analytics,
      proposals,
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
}
