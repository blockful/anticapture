import { DBOffchainProposal } from "@/mappers";

interface OffchainProposalsRepository {
  getProposals(
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
    state: string[] | undefined,
    fromDate: number | undefined,
  ): Promise<DBOffchainProposal[]>;
  getProposalsCount(
    state?: string[] | undefined,
    fromDate?: number | undefined,
  ): Promise<number>;
  getProposalById(proposalId: string): Promise<DBOffchainProposal | undefined>;
}

export interface OffchainProposalsRequest {
  skip?: number;
  limit?: number;
  orderDirection?: "asc" | "desc";
  status?: string[];
  fromDate?: number;
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
    } = params;

    const [items, totalCount] = await Promise.all([
      this.repo.getProposals(skip, limit, orderDirection, status, fromDate),
      this.repo.getProposalsCount(status, fromDate),
    ]);

    return { items, totalCount };
  }

  async getProposalById(proposalId: string) {
    return this.repo.getProposalById(proposalId);
  }
}
