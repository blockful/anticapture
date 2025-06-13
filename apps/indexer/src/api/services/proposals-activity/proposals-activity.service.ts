import { Address } from "viem";
import { DaoIdEnum } from "@/lib/enums";
import {
  ProposalsActivityRepository,
  DbProposal,
  DbVote,
} from "@/api/repositories/proposals-activity.repository";

// Constants
const SECONDS_PER_BLOCK = 12; // Ethereum average
const FINAL_PROPOSAL_STATUSES = ["EXECUTED", "DEFEATED", "CANCELED", "EXPIRED"];

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
  private repository: ProposalsActivityRepository;

  constructor() {
    this.repository = new ProposalsActivityRepository();
  }

  async getProposalsActivity({
    address,
    fromDate,
    daoId,
    skip = 0,
    limit = 10,
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

    // Calculate activity start time
    const activityStart = this.calculateActivityStart(
      firstVoteTimestamp,
      fromDate,
    );

    // Get proposals and votes
    const proposals = await this.repository.getProposals(
      daoId,
      activityStart,
      votingPeriodBlocks,
    );

    if (proposals.length === 0) {
      return this.createEmptyActivity(address, false);
    }

    const userVotes = await this.repository.getUserVotes(
      address,
      daoId,
      proposals.map((p) => p.id),
    );

    // Build response
    const proposalsWithVotes = this.buildProposalsWithVotes(
      proposals,
      userVotes,
    );
    const paginatedProposals = proposalsWithVotes.slice(skip, skip + limit);
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

    return {
      winRate: Math.round(winRate * 100) / 100,
      yesRate: Math.round(yesRate * 100) / 100,
      avgTimeBeforeEnd: 0, // TODO: Implement proper block-to-timestamp conversion
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
