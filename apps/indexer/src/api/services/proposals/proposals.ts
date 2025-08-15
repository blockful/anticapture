import { DBProposal, ProposalsRequest } from "@/api/mappers";
import { DAOClient } from "@/interfaces/client";

interface ProposalsRepository {
  getProposals(
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
    status: string | string[] | undefined,
    fromDate: number | undefined,
  ): Promise<DBProposal[]>;
  getProposalById(proposalId: string): Promise<DBProposal | undefined>;
}

export class ProposalsService {
  constructor(
    private readonly proposalsRepo: ProposalsRepository,
    private readonly daoClient: DAOClient,
  ) {}

  async getProposals({
    skip = 0,
    limit = 10,
    orderDirection = "desc",
    status,
    fromDate,
  }: ProposalsRequest): Promise<DBProposal[]> {
    const proposals = await this.proposalsRepo.getProposals(
      skip,
      limit,
      orderDirection,
      status,
      fromDate,
    );

    for (const proposal of proposals) {
      proposal.status = await this.daoClient.getProposalStatus(proposal);
    }

    // Filter by status if provided
    if (status) {
      if (typeof status === "string") {
        // Single status filter
        return proposals.filter((proposal) => proposal.status === status);
      } else if (Array.isArray(status) && status.length > 0) {
        // Multiple statuses filter
        return proposals.filter((proposal) =>
          status.includes(proposal.status),
        );
      }
    }

    return proposals;
  }

  async getProposalById(proposalId: string): Promise<DBProposal | undefined> {
    const proposal = await this.proposalsRepo.getProposalById(proposalId);

    if (!proposal) {
      return undefined;
    }

    const status = await this.daoClient.getProposalStatus(proposal);

    return { ...proposal, status };
  }
}
