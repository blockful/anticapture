import { DaoIdEnum } from "@/shared/types/daos";

import { ENS } from "./ens";
import { OP } from "./op";
import { UNI } from "./uni";
import { ARB } from "./arb";
import { DaoConfiguration } from "./types";

export type DaoConfigByDaoId = {
  [key in DaoIdEnum]: DaoConfiguration;
};

const daoConfigByDaoId: DaoConfigByDaoId = { ARB, UNI, ENS, OP };

export default daoConfigByDaoId;
