import {
  VotesRequest,
  DBVote,
  VotesResponse,
  VotesResponseSchema,
  VotersResponse,
} from "@/api/mappers";
import { DaysEnum } from "@/lib/enums";
import { Address } from "viem";

interface VotesRepository {
  getProposalNonVoters(
    proposalId: string,
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
    addresses?: Address[],
  ): Promise<{ voter: Address; votingPower: bigint }[]>;
  getProposalNonVotersCount(proposalId: string): Promise<number>;
  getVotes(req: VotesRequest): Promise<{ items: DBVote[]; totalCount: number }>;
  getVotesByProposalId(
    proposalId: string,
    skip: number,
    limit: number,
    orderBy: "timestamp" | "votingPower",
    orderDirection: "asc" | "desc",
    voterAddressIn?: Address[],
    support?: string,
    fromDate?: number,
    toDate?: number,
  ): Promise<{ items: DBVote[]; totalCount: number }>;

  getLastVotersTimestamp(voters: Address[]): Promise<Record<Address, bigint>>;
  getVotingPowerVariation(
    voters: Address[],
    comparisonTimestamp: number,
  ): Promise<Record<Address, bigint>>;
}

export class VotesService {
  constructor(private votesRepository: VotesRepository) {}
  async getVotes(params: VotesRequest): Promise<VotesResponse> {
    const response = await this.votesRepository.getVotes(params);
    return VotesResponseSchema.parse({
      items: response.items.map((item) => ({
        voterAddress: item.voterAccountId,
        transactionHash: item.txHash,
        proposalId: item.proposalId,
        support: Number(item.support),
        votingPower: item.votingPower.toString(),
        reason: item.reason ? item.reason : undefined,
        timestamp: Number(item.timestamp),
      })),
      totalCount: response.totalCount,
    });
  }

  /**
   * Returns the delegates with active delegations that didn't vote on a given proposal
   */
  async getProposalNonVoters(
    proposalId: string,
    skip: number = 0,
    limit: number,
    orderDirection: "asc" | "desc",
    addresses?: Address[],
  ): Promise<VotersResponse> {
    const nonVoters = await this.votesRepository.getProposalNonVoters(
      proposalId,
      skip,
      limit,
      orderDirection,
      addresses,
    );

    const _addresses = addresses ? addresses : nonVoters.map((v) => v.voter);

    const comparisonTimestamp = Math.floor(Date.now() / 1000 - DaysEnum["30d"]);

    const [lastVotersTimestamp, votingPowerVariation] = await Promise.all([
      this.votesRepository.getLastVotersTimestamp(_addresses),
      this.votesRepository.getVotingPowerVariation(
        _addresses,
        comparisonTimestamp,
      ),
    ]);

    return {
      totalCount: addresses
        ? _addresses.length
        : await this.votesRepository.getProposalNonVotersCount(proposalId),
      items: nonVoters.map((v) => ({
        voter: v.voter,
        votingPower: v.votingPower.toString(),
        lastVoteTimestamp: Number(lastVotersTimestamp[v.voter] || 0),
        votingPowerVariation: votingPowerVariation[v.voter]?.toString() || "0",
      })),
    };
  }

  /**
   * Returns the list of votes for a given proposal
   */
  async getVotesByProposal(
    proposalId: string,
    skip: number = 0,
    limit: number = 10,
    orderBy: "timestamp" | "votingPower" = "timestamp",
    orderDirection: "asc" | "desc" = "desc",
    voterAddressIn?: Address[],
    support?: string,
    fromDate?: number,
    toDate?: number,
  ): Promise<VotesResponse> {
    const response = await this.votesRepository.getVotesByProposalId(
      proposalId,
      skip,
      limit,
      orderBy,
      orderDirection,
      voterAddressIn,
      support,
      fromDate,
      toDate,
    );

    return VotesResponseSchema.parse({
      items: response.items.map((item) => ({
        voterAddress: item.voterAccountId,
        transactionHash: item.txHash,
        proposalId: item.proposalId,
        support: Number(item.support),
        votingPower: item.votingPower.toString(),
        reason: item.reason ? item.reason : undefined,
        timestamp: Number(item.timestamp),
      })),
      totalCount: response.totalCount,
    });
  }
}
