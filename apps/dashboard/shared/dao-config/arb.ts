import { DaoConfiguration } from "@/shared/dao-config/types";
import { SupportStageEnum } from "@/shared/types/enums/SupportStageEnum";

export const ARB: DaoConfiguration = {
  name: "Arbitrum",
  supportStage: SupportStageEnum.ELECTION,
  tokenDistribution: true,
  showSupport: true,
  attackProfitability: {
    riskLevel: undefined,
  },
};
