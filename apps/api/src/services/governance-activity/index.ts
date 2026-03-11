import { formatEther } from "viem";

import {
  ActiveSupplyQueryResult,
  AverageTurnoutCompareQueryResult,
  ProposalsCompareQueryResult,
  VotesCompareQueryResult,
} from "@/controllers";
import { DaysEnum } from "@/lib/enums";

interface GovernanceActivityRepository {
  getActiveSupply(days: DaysEnum): Promise<ActiveSupplyQueryResult | undefined>;
  getProposalsCompare(
    days: DaysEnum,
  ): Promise<ProposalsCompareQueryResult | undefined>;
  getVotesCompare(days: DaysEnum): Promise<VotesCompareQueryResult | undefined>;
  getAverageTurnoutCompare(
    days: DaysEnum,
  ): Promise<AverageTurnoutCompareQueryResult | undefined>;
  getVotesCompare(days: DaysEnum): Promise<VotesCompareQueryResult | undefined>;
}

export class GovernanceActivityService {
  constructor(
    private repository: GovernanceActivityRepository,
    private tokenType: "ERC20" | "ERC721",
  ) {}

  async getActiveSupply(days: DaysEnum) {
    return await this.repository.getActiveSupply(days);
  }

  async getAverageTurnout(days: DaysEnum) {
    const data = await this.repository.getAverageTurnoutCompare(days);

    if (!data) {
      return {
        currentAverageTurnout: "0",
        oldAverageTurnout: "0",
        changeRate: 0,
      };
    }

    if (this.tokenType === "ERC721") {
      return {
        currentAverageTurnout: data.currentAverageTurnout?.split(".")[0] || "0",
        oldAverageTurnout: data.oldAverageTurnout?.split(".")[0] || "0",
        changeRate: data.oldAverageTurnout
          ? Number(data.currentAverageTurnout) /
              Number(data.oldAverageTurnout) -
            1
          : 0,
      };
    }

    return {
      ...data,
      changeRate:
        Number(formatEther(BigInt(data.oldAverageTurnout))) > 0
          ? Number(formatEther(BigInt(data.currentAverageTurnout))) /
              Number(formatEther(BigInt(data.oldAverageTurnout))) -
            1
          : 0,
    };
  }

  async getProposals(days: DaysEnum) {
    const data = await this.repository.getProposalsCompare(days);
    if (!data) {
      return {
        currentProposalsLaunched: 0,
        oldProposalsLaunched: 0,
        changeRate: 0,
      };
    }
    const changeRate =
      data.oldProposalsLaunched &&
      data.currentProposalsLaunched / data.oldProposalsLaunched - 1;

    return {
      ...data,
      changeRate: changeRate ? Number(Number(changeRate).toFixed(2)) : 0,
    };
  }

  async getVotes(days: DaysEnum) {
    const data = await this.repository.getVotesCompare(days);
    if (!data) {
      return {
        currentVotes: 0,
        oldVotes: 0,
        changeRate: 0,
      };
    }

    const changeRate = data.oldVotes && data.currentVotes / data.oldVotes - 1;

    return {
      ...data,
      changeRate: changeRate ? Number(Number(changeRate).toFixed(2)) : 0,
    };
  }
}
