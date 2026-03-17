import { formatUnits } from "viem";

import { DaoDataCache } from "@/cache/dao-cache.interface";
import { DAOClient } from "@/clients";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { DaoIdEnum } from "@/lib/enums";
import {
  DaoParametersDBResponse,
  DaoParametersDBResponseSchema,
  DaoParametersResponse,
  DaoParametersRPCResponseSchema,
  DaoResponseMapper,
} from "@/mappers";

import { ActiveSupplyQueryResult } from "@/controllers";

interface TokenPriceClient {
  getTokenPrice(
    tokenContractAddress: string,
    targetCurrency: string,
  ): Promise<string>;
}

interface GovernanceActivityService {
  getActiveSupply(
    fromDate: number,
  ): Promise<ActiveSupplyQueryResult | undefined>;
  getAverageTurnout(fromDate: number): Promise<{
    currentAverageTurnout: string;
    oldAverageTurnout: string;
    changeRate: number;
  }>;
}

export class DaoService {
  constructor(
    private readonly client: DAOClient,
    private readonly cache: DaoDataCache,
    private readonly chainId: number,
    private readonly governanceService: GovernanceActivityService,
    private readonly tokenClient: TokenPriceClient,
  ) {}

  /**
   * Retrieves DAO governance parameters from cache or blockchain
   * Caches results
   */
  async getDaoParameters(
    fromDate: number,
    fetchGovernanceData: boolean,
  ): Promise<DaoParametersResponse> {
    const daoId = this.client.getDaoId();
    const daoParameters = await this.resolveRPCData(daoId);
    const daoData = fetchGovernanceData
      ? await this.resolveDBData(daoId, fromDate, daoParameters.quorum)
      : null;

    const daoResponse = DaoResponseMapper({
      rpcData: daoParameters,
      dbData: daoData,
    });

    return daoResponse;
  }

  private async resolveRPCData(daoId: string) {
    const cached = this.cache.get(daoId);
    if (cached) return cached;

    const [
      quorum,
      proposalThreshold,
      votingDelay,
      votingPeriod,
      timelockDelay,
      alreadySupportCalldataReview,
    ] = await Promise.all([
      this.client.getQuorum(null),
      this.client.getProposalThreshold(),
      this.client.getVotingDelay(),
      this.client.getVotingPeriod(),
      this.client.getTimelockDelay(),
      this.client.alreadySupportCalldataReview(),
    ]);

    const fresh = DaoParametersRPCResponseSchema.parse({
      id: daoId,
      chainId: this.chainId,
      quorum,
      proposalThreshold,
      votingDelay,
      votingPeriod,
      timelockDelay,
      alreadySupportCalldataReview,
    });

    this.cache.set(daoId, fresh);
    return fresh;
  }

  private async resolveDBData(
    daoId: string,
    fromDate: number,
    quorum: bigint,
  ): Promise<DaoParametersDBResponse> {
    const token = CONTRACT_ADDRESSES[daoId as DaoIdEnum].token;

    const [activeSupply, averageTurnout, tokenPrice] = await Promise.all([
      this.governanceService.getActiveSupply(fromDate),
      this.governanceService.getAverageTurnout(fromDate),
      this.tokenClient.getTokenPrice(token.address, "usd"),
    ]);

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

    return DaoParametersDBResponseSchema.parse({
      activeSupply: activeSupply,
      averageTurnout,
      quorumGap: this.calculateQuorumGap(normalizedQuorum, normalizedTurnout),
      lastPrice: tokenPrice,
    });
  }

  private calculateQuorumGap(
    quorum: number | null,
    avgTurnout: number | null,
  ): number | null {
    if (quorum === null || quorum === 0 || avgTurnout === null) return null;
    return (avgTurnout / quorum - 1) * 100;
  }
}
