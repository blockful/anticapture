import { DaoConfiguration } from "@/lib/dao-config/types";
import { SupportStageEnum } from "@/lib/enums/SupportStageEnum";
import { ArbitrumIcon } from "@/components/atoms/icons/ArbitrumIcon";

export const ARB: DaoConfiguration = {
  name: "Arbitrum",
  icon: ArbitrumIcon,
  supportStage: SupportStageEnum.ELECTION,
  tokenDistribution: true,
  showSupport: true,
  attackProfitability: {
    riskLevel: undefined,
  },
};
