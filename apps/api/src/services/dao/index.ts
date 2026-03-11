import { formatUnits } from "viem";

import { DaoDataCache } from "@/cache/dao-cache.interface";
import { DAOClient } from "@/clients";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { DaoIdEnum } from "@/lib/enums";
import { DaoResponse, DaoResponseMapper } from "@/mappers";

import { GovernanceActivityService } from "../governance-activity";
import { ProposalsService } from "../proposals";

interface TokenPriceClient {
  getTokenPrice(
    tokenContractAddress: string,
    targetCurrency: string,
  ): Promise<string>;
}

export class DaoService {
  constructor(
    private readonly client: DAOClient,
    private readonly cache: DaoDataCache,
    private readonly chainId: number,
    private readonly governanceService: GovernanceActivityService,
    private readonly proposalsService: ProposalsService,
    private readonly tokenClient: TokenPriceClient,
  ) {}

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

    const token = CONTRACT_ADDRESSES[daoId as DaoIdEnum].token;

    // Fetch from blockchain
    const [
      quorum,
      proposalThreshold,
      votingDelay,
      votingPeriod,
      timelockDelay,
    ] = await Promise.all([
      this.client.getQuorum(null),
      this.client.getProposalThreshold(),
      this.client.getVotingDelay(),
      this.client.getVotingPeriod(),
      this.client.getTimelockDelay(),
    ]);

    // Fetch from database
    const [activeSupply, averageTurnout, proposals] = await Promise.all([
      this.governanceService.getActiveSupply(fromDate),
      this.governanceService.getAverageTurnout(fromDate),
      this.proposalsService.getProposals({
        skip: 0,
        limit: 10,
        orderDirection: undefined,
        status: undefined,
        fromDate: fromDate,
        fromEndDate: undefined,
        includeOptimisticProposals: true,
      }),
    ]);

    const tokenPrice = await this.tokenClient.getTokenPrice(
      token.address,
      "usd",
    );

    const isGapEligible = proposals.length > 0;
    const normalizedQuorum = quorum
      ? Number(formatUnits(BigInt(quorum), token.decimals))
      : null;
    const normalizedTurnout = averageTurnout.currentAverageTurnout
      ? Number(
          formatUnits(
            BigInt(averageTurnout.currentAverageTurnout),
            token.decimals,
          ),
        )
      : null;

    const daoData = DaoResponseMapper({
      id: daoId,
      chainId: this.chainId,
      quorum: quorum,
      proposalThreshold: proposalThreshold,
      votingDelay: votingDelay,
      votingPeriod: votingPeriod,
      timelockDelay: timelockDelay,
      activeSupply: activeSupply,
      averageTurnout,
      quorumGap: isGapEligible
        ? this.calculateQuorumGap(normalizedQuorum, normalizedTurnout)
        : null,
      lastPrice: tokenPrice,
    });

    // Cache and return
    this.cache.set(daoId, daoData);
    return daoData;
  }

  private calculateQuorumGap(
    quorum: number | null,
    avgTurnout: number | null,
  ): number {
    return quorum && avgTurnout ? (avgTurnout / quorum - 1) * 100 : 0;
  }
}
