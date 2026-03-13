import { formatEther } from "viem";

import {
  ActiveSupplyQueryResult,
  AverageTurnoutCompareQueryResult,
  ProposalsCompareQueryResult,
  VotesCompareQueryResult,
} from "@/controllers";

interface GovernanceActivityRepository {
  getActiveSupply(
    fromDate: number,
  ): Promise<ActiveSupplyQueryResult | undefined>;
  getProposalsCompare(
    fromDate: number,
  ): Promise<ProposalsCompareQueryResult | undefined>;
  getVotesCompare(
    fromDate: number,
  ): Promise<VotesCompareQueryResult | undefined>;
  getAverageTurnoutCompare(
    fromDate: number,
  ): Promise<AverageTurnoutCompareQueryResult | undefined>;
  getVotesCompare(
    fromDate: number,
  ): Promise<VotesCompareQueryResult | undefined>;
}

export class GovernanceActivityService {
  constructor(
    private repository: GovernanceActivityRepository,
    private tokenType: "ERC20" | "ERC721",
  ) {}

  async getActiveSupply(fromDate: number) {
    return await this.repository.getActiveSupply(fromDate);
  }

  async getAverageTurnout(fromDate: number) {
    const data = await this.repository.getAverageTurnoutCompare(fromDate);

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

  async getProposals(fromDate: number) {
    const data = await this.repository.getProposalsCompare(fromDate);
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

  async getVotes(fromDate: number) {
    const data = await this.repository.getVotesCompare(fromDate);
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
