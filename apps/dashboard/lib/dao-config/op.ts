import OPLogo from "@/public/logo/Optimism.png";
import { SupportStageEnum } from "@/lib/enums/SupportStageEnum";
import { DaoConfiguration } from "@/lib/dao-config/types";

export const OP: DaoConfiguration = {
  name: "Optimism",
  // icon: OPLogo,
  supportStage: SupportStageEnum.ANALYSIS,
  disableDaoPage: true,
};
