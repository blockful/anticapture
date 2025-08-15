import { DBProposal, ProposalsRequest } from "@/api/mappers";
import { DAOClient } from "@/interfaces/client";
import { ProposalStatus } from "@/lib/constants";

interface ProposalsRepository {
  getProposals(
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
    status: string[] | undefined,
    fromDate: number | undefined,
  ): Promise<DBProposal[]>;
  getProposalById(proposalId: string): Promise<DBProposal | undefined>;
}

export class ProposalsService {
  constructor(
    private readonly proposalsRepo: ProposalsRepository,
    private readonly daoClient: DAOClient,
  ) {}

  /**
   * Prepares status array for database query.
   * Maps ACTIVE, DEFEATED, and SUCCEEDED to PENDING (as they're determined on-chain)
   * and removes duplicates.
   */
  private prepareStatusForDatabase(
    statusArray: string[] | undefined,
  ): string[] | undefined {
    if (!statusArray) return undefined;
    
    const mappedStatuses = statusArray.map((status) => {
      if (
        status === ProposalStatus.ACTIVE ||
        status === ProposalStatus.DEFEATED ||
        status === ProposalStatus.SUCCEEDED
      ) {
        return ProposalStatus.PENDING;
      }
      return status;
    });
    
    return [...new Set(mappedStatuses)]; // Remove duplicates
  }

  /**
   * Filters proposals by the originally requested status values.
   * This is necessary because on-chain determined statuses (ACTIVE, DEFEATED, SUCCEEDED)
   * are all stored as PENDING in the database.
   */
  private filterProposalsByStatus(
    proposals: DBProposal[],
    requestedStatuses: string[] | undefined,
  ): DBProposal[] {
    if (!requestedStatuses) return proposals;
    
    return proposals.filter((proposal) =>
      requestedStatuses.includes(proposal.status),
    );
  }

  async getProposals({
    skip = 0,
    limit = 10,
    orderDirection = "desc",
    status,
    fromDate,
  }: ProposalsRequest): Promise<DBProposal[]> {
    // 1. Prepare status for database query
    const dbStatuses = this.prepareStatusForDatabase(status);

    // 2. Fetch proposals from database
    const proposals = await this.proposalsRepo.getProposals(
      skip,
      limit,
      orderDirection,
      dbStatuses,
      fromDate,
    );

    // 3. Update each proposal with its real on-chain status
    for (const proposal of proposals) {
      proposal.status = await this.daoClient.getProposalStatus(proposal);
    }

    // 4. Filter by originally requested statuses (handles on-chain determined statuses)
    return this.filterProposalsByStatus(proposals, status);
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
