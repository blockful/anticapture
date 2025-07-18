import { Address } from "viem";

import { DaoIdEnum } from "@/lib/enums";
import {
  ProposalsActivityRepository,
  type ProposalWithVotes,
  type Proposal,
  type Vote,
} from "@/api/repositories/proposals-activity.repository";
import { ProposalAPI, ProposalMapper } from "@/api/mappers/proposals";

export interface ProposalActivityRequest {
  address: Address;
  fromDate?: number;
  daoId: DaoIdEnum;
  skip?: number;
  limit?: number;
  blockTime: number;
}

export interface DelegateProposalActivity {
  address: string;
  totalProposals?: number;
  votedProposals?: number;
  neverVoted?: boolean;
  winRate?: number;
  yesRate?: number;
  avgTimeBeforeEnd?: number;
  proposals: ProposalWithVotes[];
}

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
  }: ProposalActivityRequest): Promise<DelegateProposalActivity> {
    // Check if user has ever voted
    const firstVoteTimestamp =
      await this.repository.getFirstVoteTimestamp(address);

    if (!firstVoteTimestamp) return { address, proposals: [] };

    // Get voting period for the DAO
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

    const analytics = this.calculateAnalytics(proposals);

    return {
      address,
      totalProposals: proposals.length,
      votedProposals: 0,
      // votedProposals: userVotes.length,
      neverVoted: false,
      winRate: 0,
      // ...analytics,
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

  private calculateAnalytics(proposals: ProposalWithVotes[]) {
    // // Calculate yes rate (support = "1" means "For")
    // const yesVotes = userVotes.filter((vote) => vote.support === "1").length;
    // const yesRate = (yesVotes / userVotes.length) * 100;
    // // Calculate win rate for finished proposals only
    // const { winningVotes, finishedProposalsVoted } = this.calculateWinRate(
    //   proposals,
    //   userVotes,
    // );
    // const winRate =
    //   finishedProposalsVoted > 0
    //     ? (winningVotes / finishedProposalsVoted) * 100
    //     : 0;
    // // Calculate average time before end
    // const avgTimeBeforeEnd = this.calculateAvgTimeBeforeEnd(
    //   proposals,
    //   userVotes,
    // );
    // return {
    //   winRate: Math.round(winRate * 100) / 100,
    //   yesRate: Math.round(yesRate * 100) / 100,
    //   avgTimeBeforeEnd, // This parameter is in seconds
    // };
  }

  private calculateWinRate(proposals: Proposal[], userVotes: Vote[]) {
    let winningVotes = 0;
    let finishedProposalsVoted = 0;

    for (const vote of userVotes) {
      const proposal = proposals.find((p) => p.id === vote.proposalId);

      if (!this.isFinishedProposal(proposal)) continue;

      finishedProposalsVoted++;

      const winningSide = this.getWinningSide(proposal!.status!);
      if (vote.support === winningSide) {
        winningVotes++;
      }
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
    proposals: Proposal[],
    userVotes: Vote[],
  ): number {
    // if (userVotes.length === 0) {
    //   return 0;
    // }

    // const proposalMap = new Map(proposals.map((p) => [p.id, p]));
    // let totalTimeBeforeEnd = 0;
    // let validVotes = 0;

    // for (const vote of userVotes) {
    //   const proposal = proposalMap.get(vote.proposalId);
    //   if (!proposal || !proposal.proposalEndTimestamp) {
    //     continue;
    //   }

    //   const voteTimestamp = Number(vote.timestamp);
    //   const proposalEndTimestamp = Number(proposal.proposalEndTimestamp);

    //   // Calculate time difference in seconds
    //   const timeBeforeEndSeconds = proposalEndTimestamp - voteTimestamp;

    //   // Only count positive values (votes cast before proposal ended)
    //   if (timeBeforeEndSeconds > 0) {
    //     totalTimeBeforeEnd += timeBeforeEndSeconds;
    //     validVotes++;
    //   }
    // }

    // return validVotes > 0 ? Math.round(totalTimeBeforeEnd / validVotes) : 0;
    return 0;
  }
}
