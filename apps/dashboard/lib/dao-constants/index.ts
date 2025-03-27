import { DaoIdEnum } from "../types/daos";
import { ENS } from "./ens";
import { OP } from "./op";
import { DaoConstants } from "./types";
import { UNI } from "./uni";

export type DaoConstantsByDaoId = {
  [key in DaoIdEnum]: DaoConstants;
};

const daoConstantsByDaoId: DaoConstantsByDaoId = { UNI, ENS, OP };

export default daoConstantsByDaoId;
