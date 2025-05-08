import { SupportStageEnum } from "@/lib/enums/SupportStageEnum";
import { DaoConfiguration } from "@/lib/dao-config/types";

export const OP: DaoConfiguration = {
  name: "Optimism",
  supportStage: SupportStageEnum.ANALYSIS,
  disableDaoPage: true,
};
