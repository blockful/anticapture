import { DaoConfiguration } from "@/shared/dao-config/types";
import { SupportStageEnum } from "@/shared/types/enums/SupportStageEnum";
import { ArbitrumIcon } from "@/shared/components/icons";

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
