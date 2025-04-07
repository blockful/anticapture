import ArbitrumLogo from "@/public/logo/Arbitrum.png";
import { DaoConfiguration } from "./types";
import { SupportStageEnum } from "../enums/SupportStageEnum";
import { MetricTypesEnum } from "../client/constants";

export const ARB: DaoConfiguration = {
  name: "Arbitrum",
  icon: ArbitrumLogo,
  supportStage: SupportStageEnum.ELECTION,
  daoInfo: {
    enabled: false,
  },
  attackProfitability: {
    enabled: false,
  },
  governanceImplementation: {
    enabled: false,
    fields: [],
  },
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
  showSupport: {
    enabled: true,
  },
};
