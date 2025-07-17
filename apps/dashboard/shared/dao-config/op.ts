import { SupportStageEnum } from "@/shared/types/enums/SupportStageEnum";
import { DaoConfiguration } from "@/shared/dao-config/types";
import { OptimismIcon } from "@/shared/components/icons";

export const OP: DaoConfiguration = {
  name: "Optimism",
  icon: OptimismIcon,
  supportStage: SupportStageEnum.ANALYSIS,
  disableDaoPage: true,
  daoOverview: {
    chainId: 10,
    contracts: {
      token: "0x4200000000000000000000000000000000000042",
    },
  },
};
