import { DaoConfiguration } from "@/shared/dao-config/types";
import { SupportStageEnum } from "@/shared/types/enums/SupportStageEnum";
import { ArbitrumIcon } from "@/shared/components/icons";

export const ARB: DaoConfiguration = {
  name: "Arbitrum",
  daoOverview: {
    chainId: 42161,
    contracts: {
      token: "0x912CE59144191C1204E64559FE8253a0e49E6548",
    },
  },
  icon: ArbitrumIcon,
  supportStage: SupportStageEnum.ELECTION,
  tokenDistribution: true,
  showSupport: {
    snapshotProposal: "0x1247f90c1a13e6a4075611d01902b148e067994a4d4c83882dd0d79553192eb2",
    snapshotSpace: "pikonha.eth",
  },
  attackProfitability: {
    riskLevel: undefined,
  },
};
