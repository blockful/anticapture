import { DBOffchainVote, OffchainVotesRequest } from "@/mappers";

interface OffchainVotesRepository {
  getVotes(
    skip: number,
    limit: number,
    orderBy: "created" | "vp",
    orderDirection: "asc" | "desc",
    voterAddresses?: string[],
    fromDate?: number,
    toDate?: number,
  ): Promise<{
    items: (DBOffchainVote & { proposalTitle: string })[];
    totalCount: number;
  }>;
  getVotesByProposalId(
    proposalId: string,
    skip: number,
    limit: number,
    orderBy: "created" | "vp",
    orderDirection: "asc" | "desc",
    voterAddresses?: string[],
    fromDate?: number,
    toDate?: number,
  ): Promise<{
    items: (DBOffchainVote & { proposalTitle: string })[];
    totalCount: number;
  }>;
}

export class OffchainVotesService {
  constructor(private readonly repo: OffchainVotesRepository) {}

  async getVotes(params: OffchainVotesRequest) {
    const {
      skip = 0,
      limit = 10,
      orderBy = "created",
      orderDirection = "desc",
      voterAddresses,
      fromDate,
      toDate,
    } = params;

    return this.repo.getVotes(
      skip,
      limit,
      orderBy,
      orderDirection,
      voterAddresses,
      fromDate,
      toDate,
    );
  }

  async getVotesByProposalId(proposalId: string, params: OffchainVotesRequest) {
    const {
      skip = 0,
      limit = 10,
      orderBy = "created",
      orderDirection = "desc",
      voterAddresses,
      fromDate,
      toDate,
    } = params;

    return this.repo.getVotesByProposalId(
      proposalId,
      skip,
      limit,
      orderBy,
      orderDirection,
      voterAddresses,
      fromDate,
      toDate,
    );
  }
}
