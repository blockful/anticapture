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
    private readonly blockTime: number,
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

    const votingDelay = await this.daoClient.getVotingDelay();
    const quorum = await this.daoClient.getQuorum();

    const now = Math.floor(Date.now() / 1000);

    for (const proposal of proposals) {
      if (proposal.status !== ProposalStatus.PENDING) {
        continue;
      }

      const endTimestamp = await this.daoClient.getBlockTime(proposal.endBlock);

      if (!endTimestamp) {
        continue;
      }

      if (now > proposal.timestamp + votingDelay && now < endTimestamp) {
        proposal.status = ProposalStatus.ACTIVE;
      }

      const proposalQuorum = await this.daoClient.calculateQuorum({
        forVotes: proposal.forVotes,
        againstVotes: proposal.againstVotes,
        abstainVotes: proposal.abstainVotes,
      });

      if (endTimestamp && endTimestamp > now) {
        if (proposalQuorum <= quorum) {
          proposal.status = ProposalStatus.DEFEATED;
        } else {
          proposal.status = ProposalStatus.EXPIRED;
        }
      }
    }

    return ProposalMapper.toApi(proposals, this.blockTime);
  }
}
