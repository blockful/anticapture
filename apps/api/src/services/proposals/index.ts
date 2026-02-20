import { DAOClient } from "@/clients";
import { DBProposal, ProposalsRequest } from "@/mappers";
import { ProposalStatus } from "@/lib/constants";

interface ProposalsRepository {
  getProposals(
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
    status: string[] | undefined,
    fromDate: number | undefined,
    fromEndDate: number | undefined,
    proposalTypeExclude?: number[],
  ): Promise<DBProposal[]>;
  getProposalsCount(): Promise<number>;
  getProposalById(proposalId: string): Promise<DBProposal | undefined>;
}

export class ProposalsService {
  constructor(
    private readonly proposalsRepo: ProposalsRepository,
    private readonly daoClient: DAOClient,
    private readonly optimisticProposalType?: number,
  ) {}

  async getProposalsCount(): Promise<number> {
    return this.proposalsRepo.getProposalsCount();
  }

  /**
   * Prepares status array for database query.
   * Maps ACTIVE, DEFEATED, and SUCCEEDED to PENDING (as they're determined on-chain)
   * and removes duplicates.
   */
  private prepareStatusForDatabase(statusArray: string[]): string[] {
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
    requestedStatuses: string[],
  ): DBProposal[] {
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
    fromEndDate,
    includeOptimisticProposals = true,
  }: ProposalsRequest): Promise<DBProposal[]> {
    // 1. Prepare status for database query
    const dbStatuses = status
      ? this.prepareStatusForDatabase(status)
      : undefined;

    // 2. Filter proposal type using DAO config
    const proposalTypeExclude =
      !includeOptimisticProposals && this.optimisticProposalType !== undefined
        ? [this.optimisticProposalType]
        : undefined;

    // 3. Fetch proposals from database
    const proposals = await this.proposalsRepo.getProposals(
      skip,
      limit,
      orderDirection,
      dbStatuses,
      fromDate,
      fromEndDate,
      proposalTypeExclude,
    );

    // 4. Update each proposal with its real on-chain status
    for (const proposal of proposals) {
      proposal.status = await this.daoClient.getProposalStatus(proposal);
    }

    // 5. Filter by originally requested statuses (handles on-chain determined statuses)
    return status ? this.filterProposalsByStatus(proposals, status) : proposals;
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
