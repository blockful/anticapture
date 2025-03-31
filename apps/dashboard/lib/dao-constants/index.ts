import { DaoIdEnum } from "../types/daos";
import { ENS } from "./ens";
import { OP } from "./op";
import { DaoConstants } from "./types";
import { UNI } from "./uni";
import { ARB } from "./arb";

export type DaoConstantsByDaoId = {
  [key in DaoIdEnum]: DaoConstants;
};

const daoConstantsByDaoId: DaoConstantsByDaoId = { ARB, UNI, ENS, OP };

export default daoConstantsByDaoId;
