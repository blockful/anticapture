import { DBProposal, ProposalsRequest } from "@/api/mappers";
import { DAOClient } from "@/interfaces/client";

interface ProposalsRepository {
  getProposals(
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
    status: string | undefined,
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

    if (status) {
      // filtering proposals marked as "PENDING" on the database,
      // but representing different statuses onchain
      return proposals.filter((proposal) => proposal.status === status);
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
