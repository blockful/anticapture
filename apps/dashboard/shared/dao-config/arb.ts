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
  showSupport:
    process.env.NEXT_PUBLIC_SNAPSHOT_PROPOSAL_ARB &&
    process.env.NEXT_PUBLIC_SNAPSHOT_SPACE
      ? {
          snapshotProposal: process.env.NEXT_PUBLIC_SNAPSHOT_PROPOSAL_ARB,
          snapshotSpace: process.env.NEXT_PUBLIC_SNAPSHOT_SPACE,
        }
      : undefined,
  attackProfitability: {
    riskLevel: undefined,
    attackCostBarChart: {
      ArbitrumDaoWallet: "",
      ArbitrumTimelock: "",
      ArbitrumTokenDistributor: "",
    },
  },
};
