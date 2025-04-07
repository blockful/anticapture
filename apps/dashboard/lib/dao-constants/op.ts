import { DaoIdEnum } from "../types/daos";
import OPLogo from "@/public/logo/Optimism.png";
import { SupportStageEnum } from "../enums/SupportStageEnum";
import { DaoConfiguration } from "./types";

export const OP: DaoConfiguration = {
  name: "Optimism",
  icon: OPLogo,
  supportStage: SupportStageEnum.EMPTY_ANALYSIS,
  disableDaoPage: true
};
