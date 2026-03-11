import { DaoDataCache } from "@/cache/dao-cache.interface";
import { DAOClient } from "@/clients";
import { DaoResponse } from "@/mappers";

import { GovernanceActivityService } from "../governance-activity";

// quorumGap: number;
// proposalThreshold: number;
// lastPrice: number;

export class DaoService {
  constructor(
    private readonly client: DAOClient,
    private readonly cache: DaoDataCache,
    private readonly chainId: number,
    private readonly governanceService: GovernanceActivityService,
  ) { }

  /**
   * Retrieves DAO governance parameters from cache or blockchain
   * Caches results
   */
  async getDaoParameters(fromDate: number): Promise<DaoResponse> {
    const daoId = this.client.getDaoId();

    // Check cache first
    const cached = this.cache.get(daoId);
    if (cached) {
      return cached;
    }

    // Fetch from blockchain
    const [
      quorum,
      proposalThreshold,
      votingDelay,
      votingPeriod,
      timelockDelay,
      activeSupply,
      averageTurnout,
    ] = await Promise.all([
      this.client.getQuorum(null),
      this.client.getProposalThreshold(),
      this.client.getVotingDelay(),
      this.client.getVotingPeriod(),
      this.client.getTimelockDelay(),
      this.governanceService.getActiveSupply(fromDate),
      this.governanceService.getAverageTurnout(fromDate),
    ]);

    const daoData: DaoResponse = {
      id: daoId,
      chainId: this.chainId,
      quorum: quorum.toString(),
      proposalThreshold: proposalThreshold.toString(),
      votingDelay: votingDelay.toString(),
      votingPeriod: votingPeriod.toString(),
      timelockDelay: timelockDelay.toString(),
      activeSupply: activeSupply?.activeSupply ?? "0",
      averageTurnout: {
        // TODO: Move to mapper
        ...averageTurnout,
        changeRate: averageTurnout.changeRate.toString(),
      },
    };

    // Cache and return
    this.cache.set(daoId, daoData);
    return daoData;
  }
}
