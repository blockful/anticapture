import { DaoIdEnum } from "@/shared/types/daos";

import { ENS } from "@/shared/dao-config/ens";
import { OP } from "@/shared/dao-config/op";
import { UNI } from "@/shared/dao-config/uni";
import { GTC } from "@/shared/dao-config/gtc";
import { SCR } from "@/shared/dao-config/scr";
import { DaoConfiguration } from "@/shared/dao-config/types";

export type DaoConfigByDaoId = {
  [key in DaoIdEnum]: DaoConfiguration;
};

const daoConfigByDaoId: DaoConfigByDaoId = { UNI, ENS, OP, GTC, SCR };

export default daoConfigByDaoId;
