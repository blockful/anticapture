import { DBProposal, ProposalsRequest } from "@/api/mappers";
import { ProposalStatus } from "@/lib/constants";
import { DAOClient } from "@/interfaces/client";

interface ProposalsRepository {
  getProposals(
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
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
  }: ProposalsRequest): Promise<DBProposal[]> {
    const proposals = await this.proposalsRepo.getProposals(
      skip,
      limit,
      orderDirection,
    );

    const currentBlock = await this.daoClient.getCurrentBlockNumber();

    for (const proposal of proposals) {
      proposal.status = await this.updateProposalStatus(proposal, currentBlock);
    }

    return proposals;
  }

  async getProposalById(proposalId: string): Promise<DBProposal | undefined> {
    const proposal = await this.proposalsRepo.getProposalById(proposalId);

    if (!proposal) {
      return undefined;
    }

    const currentBlock = await this.daoClient.getCurrentBlockNumber();
    const status = await this.updateProposalStatus(proposal, currentBlock);

    return { ...proposal, status };
  }

  private async updateProposalStatus(
    proposal: DBProposal,
    currentBlock: number,
  ): Promise<ProposalStatus> {
    // Skip proposals already finalized via event
    if (
      [
        ProposalStatus.CANCELED,
        ProposalStatus.QUEUED,
        ProposalStatus.EXECUTED,
      ].includes(proposal.status)
    ) {
      return proposal.status;
    }

    if (currentBlock < proposal.startBlock) {
      return ProposalStatus.PENDING;
    }

    if (
      currentBlock >= proposal.startBlock &&
      currentBlock < proposal.endBlock
    ) {
      return ProposalStatus.ACTIVE;
    }

    // After voting period ends
    if (currentBlock >= proposal.endBlock) {
      const proposalQuorum = this.daoClient.calculateQuorum({
        forVotes: proposal.forVotes,
        againstVotes: proposal.againstVotes,
        abstainVotes: proposal.abstainVotes,
      });

      const quorum = await this.daoClient.getQuorum(proposal.id);
      const hasQuorum = proposalQuorum >= quorum;
      const hasMajority = proposal.forVotes > proposal.againstVotes;

      if (!hasQuorum || !hasMajority) {
        return ProposalStatus.DEFEATED;
      }
      return ProposalStatus.SUCCEEDED;
    }

    return proposal.status;
  }
}
