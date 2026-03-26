import { Address } from "viem";

import { OffchainVotersResponse } from "@/mappers";

export interface OffchainNonVotersRepository {
  getOffchainNonVoters(
    proposalId: string,
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
    addresses?: Address[],
  ): Promise<{ voter: Address; votingPower: bigint }[]>;
  getOffchainNonVotersCount(proposalId: string): Promise<number>;
}

export class OffchainNonVotersService {
  constructor(private readonly repo: OffchainNonVotersRepository) {}

  async getProposalNonVoters(
    proposalId: string,
    skip: number = 0,
    limit: number,
    orderDirection: "asc" | "desc",
    addresses?: Address[],
  ): Promise<OffchainVotersResponse> {
    const nonVoters = await this.repo.getOffchainNonVoters(
      proposalId,
      skip,
      limit,
      orderDirection,
      addresses,
    );

    return {
      totalCount: addresses
        ? addresses.length
        : await this.repo.getOffchainNonVotersCount(proposalId),
      items: nonVoters.map((v) => ({
        voter: v.voter,
        votingPower: v.votingPower.toString(),
      })),
    };
  }
}
