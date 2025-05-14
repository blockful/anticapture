import { SupportStageEnum } from "@/shared/types/enums/SupportStageEnum";
import { DaoConfiguration } from "@/shared/dao-config/types";

export const OP: DaoConfiguration = {
  name: "Optimism",
  supportStage: SupportStageEnum.ANALYSIS,
  disableDaoPage: true,
};
