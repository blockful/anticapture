import ArbitrumLogo from "@/public/logo/Arbitrum.png";
import { DaoConfiguration } from "@/lib/dao-config/types";
import { SupportStageEnum } from "@/lib/enums/SupportStageEnum";

export const ARB: DaoConfiguration = {
  name: "Arbitrum",
  icon: ArbitrumLogo,
  supportStage: SupportStageEnum.ELECTION,
  tokenDistribution: true,
  showSupport: true,
  attackProfitability: {
    riskLevel: undefined,
  },
};
