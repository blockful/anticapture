import ArbitrumLogo from "@/public/logo/Arbitrum.png";
import { DaoConfiguration } from "./types";
import { SupportStageEnum } from "../enums/SupportStageEnum";
import { MetricTypesEnum } from "../client/constants";

export const ARB: DaoConfiguration = {
  name: "Arbitrum",
  icon: ArbitrumLogo,
  supportStage: SupportStageEnum.ELECTION,
  tokenDistribution: true,
  showSupport: true,
  attackProfitability: {
    riskLevel: undefined,
    blurChart: true,
  },
};
