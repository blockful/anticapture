import { SupportStageEnum } from "@/lib/enums/SupportStageEnum";
import { DaoConfiguration } from "@/lib/dao-config/types";
import { OptimismIcon } from "@/components/atoms";

export const OP: DaoConfiguration = {
  name: "Optimism",
  icon: OptimismIcon,
  supportStage: SupportStageEnum.ANALYSIS,
  disableDaoPage: true,
};
