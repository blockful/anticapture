import ArbitrumLogo from "@/public/logo/Arbitrum.png";
import { DaoConfiguration } from "./types";
import { SupportStageEnum } from "../enums/SupportStageEnum";
import { MetricTypesEnum } from "../client/constants";

export const ARB: DaoConfiguration = {
  name: "Arbitrum",
  icon: ArbitrumLogo,
  supportStage: SupportStageEnum.ELECTION,
  // Basic DAO info shown for all stages except EMPTY_ANALYSIS
  daoInfo: {
    enabled: false,
  },

  // Attack profitability shown for all stages except EMPTY_ANALYSIS
  attackProfitability: {
    enabled: false,
  },

  // Governance implementation disabled for non-FULL stage
  governanceImplementation: {
    enabled: false,
    fields: [],
  },

  // Token distribution shown for all stages except EMPTY_ANALYSIS
  tokenDistribution: {
    enabled: true,
    blurChart: true,  
    blurFields: {
      [MetricTypesEnum.TOTAL_SUPPLY]: false,
      [MetricTypesEnum.CIRCULATING_SUPPLY]: false,
      [MetricTypesEnum.CEX_SUPPLY]: true,
      [MetricTypesEnum.DEX_SUPPLY]: true,
      [MetricTypesEnum.LENDING_SUPPLY]: true,
      [MetricTypesEnum.DELEGATED_SUPPLY]: true,
    },
  },

  // Governance activity disabled for non-FULL stage
  governanceActivity: {
    enabled: false,
    blurFields: {
      [MetricTypesEnum.VOTES]: true,
      [MetricTypesEnum.PROPOSALS]: true,
      [MetricTypesEnum.ACTIVE_SUPPLY]: true,
      [MetricTypesEnum.AVERAGE_TURNOUT]: true,
      [MetricTypesEnum.TREASURY]: true,
    },
  },
  // Show support section enabled for ELECTION stage
  showSupport: {
    enabled: true,
  },
};
