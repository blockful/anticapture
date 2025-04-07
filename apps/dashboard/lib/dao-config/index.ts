import { DaoIdEnum } from "../types/daos";
import { ENS } from "./ens";
import { OP } from "./op";
import { DaoConfiguration } from "./types";
import { UNI } from "./uni";
import { ARB } from "./arb";

export type DaoConfigByDaoId = {
  [key in DaoIdEnum]: DaoConfiguration;
};

const daoConfigByDaoId: DaoConfigByDaoId = { ARB, UNI, ENS, OP };

export default daoConfigByDaoId;
