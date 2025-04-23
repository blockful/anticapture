import { DaoIdEnum } from "@/lib/types/daos";
import { ENS } from "@/lib/dao-config/ens";
import { OP } from "@/lib/dao-config/op";
import { DaoConfiguration } from "@/lib/dao-config/types";
import { UNI } from "@/lib/dao-config/uni";
import { ARB } from "@/lib/dao-config/arb";

export type DaoConfigByDaoId = {
  [key in DaoIdEnum]: DaoConfiguration;
};

const daoConfigByDaoId: DaoConfigByDaoId = { ARB, UNI, ENS, OP };

export default daoConfigByDaoId;
