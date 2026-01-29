import {
  VotesRequest,
  DBVote,
  VotesResponse,
  parseVoteToResponse,
} from "@/api/mappers";
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
    req: VotesRequest,
  ): Promise<{ items: DBVote[]; totalCount: number }>;
}

export class VotesService {
  constructor(private votesRepository: VotesRepository) {}
  async getVotes(params: VotesRequest): Promise<VotesResponse> {
    return this.votesRepository.getVotes(params);
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
  ): Promise<VotesResponse> {
    const [items, totalCount] = await Promise.all([
      this.votesRepository.getVotes(
        proposalId,
        skip,
        limit,
        orderBy,
        orderDirection,
        voterAddressIn,
        support,
      ),
      this.votesRepository.getVotesCount(proposalId, voterAddressIn, support),
    ]);

    return VotesResponseSchema.parse({
      totalCount,
      items,
    });
  }
}
