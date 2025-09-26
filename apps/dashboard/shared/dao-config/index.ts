import { DaoIdEnum } from "@/shared/types/daos";

import { ENS } from "@/shared/dao-config/ens";
import { OP } from "@/shared/dao-config/op";
import { UNI } from "@/shared/dao-config/uni";
import { ARB } from "@/shared/dao-config/arb";
import { GTC } from "@/shared/dao-config/gtc";
import { NOUNS } from "@/shared/dao-config/nouns";
import { DaoConfiguration } from "@/shared/dao-config/types";

export type DaoConfigByDaoId = {
  [key in DaoIdEnum]: DaoConfiguration;
};

const daoConfigByDaoId: DaoConfigByDaoId = { ARB, UNI, ENS, OP, GTC, NOUNS };

export default daoConfigByDaoId;
