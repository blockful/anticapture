import { DBOffchainProposal, OffchainProposalMapper } from "@/mappers";
import type { OffchainProposalWithScores } from "@/repositories";

interface OffchainProposalsRepository {
  getProposals(
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
    state: string[] | undefined,
    fromDate: number | undefined,
    endDate: number | undefined,
  ): Promise<DBOffchainProposal[] | OffchainProposalWithScores[]>;
  getProposalsCount(
    state?: string[] | undefined,
    fromDate?: number | undefined,
    endDate?: number | undefined,
  ): Promise<number>;
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

    const [rawItems, totalCount] = await Promise.all([
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

    const items = rawItems.map(OffchainProposalMapper.toApi);

    return { items, totalCount };
  }

  async getProposalById(proposalId: string) {
    const proposal = await this.repo.getProposalById(proposalId);
    if (!proposal) return undefined;
    return OffchainProposalMapper.toApi(proposal);
  }
}
