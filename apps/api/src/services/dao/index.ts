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

    // Cache and return
    this.cache.set(daoId, daoParameters);
    return daoResponse;
  }

  private async resolveRPCData(daoId: string) {
    const cached = this.cache.get(daoId);

    return (
      cached ??
      (await (async () => {
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

        return DaoParametersRPCResponseSchema.parse({
          id: daoId,
          chainId: this.chainId,
          quorum,
          proposalThreshold,
          votingDelay,
          votingPeriod,
          timelockDelay,
        });
      })())
    );
  }

  private async resolveDBData(
    daoId: string,
    fromDate: number,
    quorum: bigint,
  ): Promise<DaoParametersDBResponse> {
    const token = CONTRACT_ADDRESSES[daoId as DaoIdEnum].token;

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

    return DaoParametersDBResponseSchema.parse({
      activeSupply: activeSupply,
      averageTurnout,
      quorumGap: isGapEligible
        ? this.calculateQuorumGap(normalizedQuorum, normalizedTurnout)
        : null,
      lastPrice: tokenPrice,
    });
  }

  private calculateQuorumGap(
    quorum: number | null,
    avgTurnout: number | null,
  ): number {
    if (quorum === null || quorum === 0 || avgTurnout === null) return 0;
    return (avgTurnout / quorum - 1) * 100;
  }
}
