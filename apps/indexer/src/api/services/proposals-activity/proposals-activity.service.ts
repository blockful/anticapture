import { DaoIdEnum } from "@/lib/enums";
import {
  ProposalsActivityRepository,
  type ProposalWithVotes,
  type Proposal,
} from "@/api/repositories/proposals-activity.repository";
import { ProposalAPI, ProposalMapper } from "@/api/mappers/proposals";
import {
  ProposalActivityRequest,
  ProposalActivityResponse,
} from "@/api/mappers/proposalActivity";

export class ProposalsActivityService {
  private readonly proposalMapper = ProposalMapper;

  constructor(private readonly repository: ProposalsActivityRepository) {}

  async getProposals(limit: number, skip: number): Promise<ProposalAPI[]> {
    const proposals = await this.repository.getProposals(limit, skip);
    return proposals.map((proposal) =>
      this.proposalMapper.toAPI(proposal, {
        quorumReached: false,
        currentQuorum: "0",
      }),
    );
  }

  async getProposalById(id: string): Promise<ProposalAPI | undefined> {
    const proposal = await this.repository.getProposalById(id);

    if (!proposal) {
      return undefined;
    }

    const quorumReached = false;
    const currentQuorum = "0";

    return this.proposalMapper.toAPI(proposal, {
      quorumReached,
      currentQuorum,
    });
  }

  async getProposalsActivity({
    address,
    fromDate,
    daoId,
    skip = 0,
    limit = 10,
    blockTime,
  }: ProposalActivityRequest & {
    daoId: DaoIdEnum;
    blockTime: number;
  }): Promise<ProposalActivityResponse> {
    // Check if user has ever voted
    const firstVoteTimestamp =
      await this.repository.getFirstVoteTimestamp(address);

    if (!firstVoteTimestamp)
      return {
        address,
        proposals: [],
        totalProposals: 0,
        votedProposals: 0,
        neverVoted: false,
        winRate: 0,
        yesRate: 0,
        avgTimeBeforeEnd: 0,
      };

    const votingPeriodBlocks = await this.repository.getDaoVotingPeriod(daoId);
    if (!votingPeriodBlocks) {
      throw new Error(`DAO ${daoId} not found or missing voting period`);
    }

    const votingPeriodSeconds = votingPeriodBlocks * blockTime;

    const activityStart = this.calculateActivityStart(
      Number(firstVoteTimestamp),
      fromDate,
    );

    const proposals = await this.repository.getProposalsWithVotes(
      activityStart,
      votingPeriodSeconds,
      skip,
      limit,
    );

    const { winRate, yesRate, avgTimeBeforeEnd } = this.calculateAnalytics(
      proposals,
      votingPeriodSeconds,
    );

    return {
      address,
      totalProposals: proposals.length,
      votedProposals: 0,
      winRate,
      yesRate,
      avgTimeBeforeEnd,
      // votedProposals: userVotes.length,
      neverVoted: false,
      proposals: proposals.map((proposal) =>
        this.proposalMapper.toAPI(proposal, {
          quorumReached: false,
          currentQuorum: "0",
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
    proposals: ProposalWithVotes[],
    votingPeriodSeconds: number,
  ) {
    const votes = proposals.flatMap((proposal) => proposal.votes);

    // Calculate yes rate (support = "1" means "For")
    const yesVotes = votes.filter((vote) => vote.support === "1").length;
    const yesRate = (yesVotes / votes.length) * 100;

    const { winningVotes, finishedProposalsVoted } =
      this.calculateWinRate(proposals);
    const winRate =
      finishedProposalsVoted > 0
        ? (winningVotes / finishedProposalsVoted) * 100
        : 0;
    // Calculate average time before end
    const avgTimeBeforeEnd = this.calculateAvgTimeBeforeEnd(
      proposals,
      votingPeriodSeconds,
    );
    return {
      winRate: Math.round(winRate * 100) / 100,
      yesRate: Math.round(yesRate * 100) / 100,
      avgTimeBeforeEnd, // This parameter is in seconds
    };
  }

  private calculateWinRate(proposals: ProposalWithVotes[]) {
    let winningVotes = 0;
    let finishedProposalsVoted = 0;

    for (const proposal of proposals) {
      if (!this.isFinishedProposal(proposal)) continue;

      finishedProposalsVoted++;

      const winningSide = this.getWinningSide(proposal.status);
      winningVotes += proposal.votes.reduce(
        (acc, vote) => acc + Number(vote.support === winningSide),
        0,
      );
    }

    return { winningVotes, finishedProposalsVoted };
  }

  private isFinishedProposal(proposal: Proposal | undefined): boolean {
    return !!(
      proposal?.status &&
      ["executed", "defeated", "canceled", "expired"].includes(
        proposal.status,
      ) &&
      proposal.forVotes !== null &&
      proposal.againstVotes !== null &&
      proposal.abstainVotes !== null
    );
  }

  private getWinningSide(status: string): string {
    const statusUpper = status.toUpperCase();
    return statusUpper === "EXECUTED" ? "1" : "0"; // "1" = For, "0" = Against
  }

  private calculateAvgTimeBeforeEnd(
    proposals: ProposalWithVotes[],
    votingPeriodSeconds: number,
  ): number {
    let totalTimeBeforeEnd = 0;
    let validVotes = 0;

    for (const proposal of proposals) {
      for (const vote of proposal.votes) {
        const voteTimestamp = Number(vote.timestamp);
        const proposalEndTimestamp =
          Number(proposal.timestamp) + votingPeriodSeconds;

        // Calculate time difference in seconds
        const timeBeforeEndSeconds = proposalEndTimestamp - voteTimestamp;

        // Only count positive values (votes cast before proposal ended)
        if (timeBeforeEndSeconds > 0) {
          totalTimeBeforeEnd += timeBeforeEndSeconds;
          validVotes++;
        }
      }
    }

    return validVotes > 0 ? Math.round(totalTimeBeforeEnd / validVotes) : 0;
  }
}
