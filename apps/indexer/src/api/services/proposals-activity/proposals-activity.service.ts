import { ProposalsActivityRepository } from "@/api/repositories/proposals-activity.repository";
import {
  type ProposalActivityRequest,
  type DbProposalWithVote,
  type ProposalActivityResponse,
} from "@/api/mappers";
import { ProposalStatus } from "ponder:schema";
import { DaoIdEnum } from "@/lib/enums";

const FINAL_PROPOSAL_STATUSES = ["EXECUTED", "DEFEATED", "CANCELED", "EXPIRED"];

export class ProposalsActivityService {
  constructor(private readonly repository: ProposalsActivityRepository) {}

  async getProposalsActivity({
    address,
    fromDate,
    daoId,
    skip = 0,
    limit = 10,
    blockTime,
    orderBy = "timestamp",
    orderDirection = "desc",
    userVoteFilter,
  }: ProposalActivityRequest & {
    daoId: DaoIdEnum;
    blockTime: number;
  }): Promise<ProposalActivityResponse> {
    // Check if user has ever voted
    const firstVoteTimestamp =
      await this.repository.getFirstVoteTimestamp(address);

    if (!firstVoteTimestamp) {
      return this.createEmptyActivity(address, true);
    }

    // Get voting period for the DAO
    const votingPeriodBlocks = await this.repository.getDaoVotingPeriod(daoId);
    if (!votingPeriodBlocks) {
      throw new Error(`DAO ${daoId} not found or missing voting period`);
    }

    const votingPeriodSeconds = votingPeriodBlocks * blockTime;

    // Calculate activity start time
    const activityStart = this.calculateActivityStart(
      firstVoteTimestamp,
      fromDate,
    );

    // Get proposals with votes, filtering, sorting, and pagination in SQL
    const { proposals, totalCount } =
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

    if (proposals.length === 0) return this.createEmptyActivity(address, false);

    // Calculate analytics (we still need this for the metrics)
    const allProposals = await this.repository.getProposals(
      activityStart,
      votingPeriodSeconds,
    );
    const analytics = this.calculateAnalytics(allProposals);

    return {
      address,
      totalProposals: totalCount,
      votedProposals: proposals
        .map((p) => p.votes)
        .flat()
        .filter(Boolean).length,
      neverVoted: false,
      ...analytics,
      proposals: proposals.map(
        ({
          id,
          proposerAccountId,
          description,
          startBlock,
          endBlock,
          timestamp,
          status,
          forVotes,
          againstVotes,
          abstainVotes,
          votes,
        }) => ({
          id,
          proposerAccountId,
          description,
          startBlock,
          endBlock,
          timestamp,
          status: status.toString(),
          forVotes: forVotes.toString(),
          againstVotes: againstVotes.toString(),
          abstainVotes: abstainVotes.toString(),
          userVote: votes.length === 1 ? votes[0] : undefined,
        }),
      ),
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

  private calculateAnalytics(
    proposals: (DbProposalWithVote & { proposalEndTimestamp: number })[],
  ) {
    const userVotes = proposals.map((p) => p.votes).flat();

    if (userVotes.length === 0) {
      return { winRate: 0, yesRate: 0, avgTimeBeforeEnd: 0 };
    }

    // Calculate yes rate (support = "1" means "For")
    const yesVotes = userVotes.filter((vote) => vote.support === "1").length;
    const yesRate = (yesVotes / userVotes.length) * 100;

    // Calculate win rate for finished proposals only
    const { winningVotes, finishedProposalsVoted } =
      this.calculateWinRate(proposals);
    const winRate =
      finishedProposalsVoted > 0
        ? (winningVotes / finishedProposalsVoted) * 100
        : 0;

    return {
      winRate: Math.round(winRate * 100) / 100,
      yesRate: Math.round(yesRate * 100) / 100,
      avgTimeBeforeEnd: this.calculateAvgTimeBeforeEnd(proposals), // This parameter is in seconds
    };
  }

  private calculateWinRate(proposals: DbProposalWithVote[]) {
    let winningVotes = 0;
    let finishedProposalsVoted = 0;

    for (const proposal of proposals) {
      if (!this.isFinishedProposal(proposal)) continue;
      const winningSide = this.getWinningSide(proposal.status);

      finishedProposalsVoted++;

      if (proposal.votes.some((vote) => vote.support === winningSide)) {
        winningVotes++;
      }
    }

    return { winningVotes, finishedProposalsVoted };
  }

  private isFinishedProposal(proposal: DbProposalWithVote): boolean {
    return !!(
      proposal.status &&
      FINAL_PROPOSAL_STATUSES.includes(proposal.status.toUpperCase()) &&
      proposal.forVotes !== null &&
      proposal.againstVotes !== null &&
      proposal.abstainVotes !== null
    );
  }

  private getWinningSide(status: ProposalStatus): string {
    return status === ProposalStatus.EXECUTED ? "1" : "0"; // "1" = For, "0" = Against
  }

  private calculateAvgTimeBeforeEnd(
    proposals: (DbProposalWithVote & { proposalEndTimestamp: number })[],
  ): number {
    const userVotes = proposals.map((p) => p.votes).flat();

    if (userVotes.length === 0) return 0;

    const proposalMap = new Map(proposals.map((p) => [p.id, p]));
    let totalTimeBeforeEnd = 0;
    let validVotes = 0;

    for (const vote of userVotes) {
      const proposal = proposalMap.get(vote.proposalId);
      if (!proposal || !proposal.proposalEndTimestamp) {
        continue;
      }

      const voteTimestamp = Number(vote.timestamp);
      const proposalEndTimestamp = Number(proposal.proposalEndTimestamp);

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
  ): ProposalActivityResponse {
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
