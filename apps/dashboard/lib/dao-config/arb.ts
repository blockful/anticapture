import { DaoConfiguration } from "@/lib/dao-config/types";
import { SupportStageEnum } from "@/lib/enums/SupportStageEnum";

export const ARB: DaoConfiguration = {
  name: "Arbitrum",
  supportStage: SupportStageEnum.ELECTION,
  tokenDistribution: true,
  showSupport: true,
  attackProfitability: {
    riskLevel: undefined,
  },
};
