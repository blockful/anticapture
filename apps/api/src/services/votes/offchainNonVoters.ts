import { Address } from "viem";

import { OffchainVotersResponse } from "@/mappers";
import { OffchainNonVotersRepository } from "@/repositories";

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
      totalCount: await this.repo.getOffchainNonVotersCount(
        proposalId,
        addresses,
      ),
      items: nonVoters.map((v) => ({
        voter: v.voter,
        votingPower: v.votingPower.toString(),
      })),
    };
  }
}
