import { DBOffchainProposal } from "@/mappers";

interface OffchainProposalsRepository {
  getProposals(
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
    state: string[] | undefined,
    fromDate: number | undefined,
    endDate: number | undefined,
  ): Promise<DBOffchainProposal[]>;
  getProposalsCount(
    state?: string[] | undefined,
    fromDate?: number | undefined,
    endDate?: number | undefined,
  ): Promise<number>;
  searchProposals(
    query: string,
    skip: number,
    limit: number,
  ): Promise<DBOffchainProposal[]>;
  getSearchProposalsCount(query: string): Promise<number>;
  getProposalById(proposalId: string): Promise<DBOffchainProposal | undefined>;
}

export interface OffchainProposalsRequest {
  skip?: number;
  limit?: number;
  orderDirection?: "asc" | "desc";
  status?: string[];
  fromDate?: number;
  endDate?: number;
}

export interface OffchainProposalSearchRequest {
  query: string;
  skip?: number;
  limit?: number;
}

export class OffchainProposalsService {
  constructor(private readonly repo: OffchainProposalsRepository) {}

  async getProposals(params: OffchainProposalsRequest) {
    const {
      skip = 0,
      limit = 10,
      orderDirection = "desc",
      status,
      fromDate,
      endDate,
    } = params;

    const [items, totalCount] = await Promise.all([
      this.repo.getProposals(
        skip,
        limit,
        orderDirection,
        status,
        fromDate,
        endDate,
      ),
      this.repo.getProposalsCount(status, fromDate, endDate),
    ]);

    return { items, totalCount };
  }

  async getProposalById(proposalId: string) {
    return this.repo.getProposalById(proposalId);
  }

  async searchProposals(params: OffchainProposalSearchRequest) {
    const { query, skip = 0, limit = 10 } = params;

    const [items, totalCount] = await Promise.all([
      this.repo.searchProposals(query, skip, limit),
      this.repo.getSearchProposalsCount(query),
    ]);

    return { items, totalCount };
  }
}
