import {
  DBProposal,
  ProposalMapper,
  ProposalsRequest,
  ProposalsResponse,
} from "@/api/mappers";
import { ProposalStatus } from "@/lib/constants";
import { DAOClient } from "@/interfaces/client";

interface ProposalsRepository {
  getProposals(
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
  ): Promise<DBProposal[]>;
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
  }: ProposalsRequest): Promise<ProposalsResponse> {
    const proposals = await this.proposalsRepo.getProposals(
      skip,
      limit,
      orderDirection,
    );

    const currentBlock = await this.daoClient.getCurrentBlockNumber();

    for (const proposal of proposals) {
      // Skip proposals already finalized via event
      if (
        [
          ProposalStatus.CANCELED,
          ProposalStatus.QUEUED,
          ProposalStatus.EXECUTED,
        ].includes(proposal.status)
      ) {
        continue;
      }

      if (currentBlock < proposal.startBlock) {
        proposal.status = ProposalStatus.PENDING;
        continue;
      }

      if (
        currentBlock >= proposal.startBlock &&
        currentBlock < proposal.endBlock
      ) {
        proposal.status = ProposalStatus.ACTIVE;
        continue;
      }

      // After voting period ends
      if (currentBlock >= proposal.endBlock) {
        const proposalQuorum = await this.daoClient.calculateQuorum({
          forVotes: proposal.forVotes,
          againstVotes: proposal.againstVotes,
          abstainVotes: proposal.abstainVotes,
        });

        const quorum = await this.daoClient.getQuorum(proposal.id);
        const hasQuorum = proposalQuorum >= quorum;
        const hasMajority = proposal.forVotes > proposal.againstVotes;

        if (!hasQuorum || !hasMajority) {
          proposal.status = ProposalStatus.DEFEATED;
        } else {
          proposal.status = ProposalStatus.SUCCEEDED;
        }
      }
    }

    return ProposalMapper.toApi(proposals);
  }
}
