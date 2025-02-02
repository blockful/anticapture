import { DaoIdEnum } from "../types/daos";
import { ENS } from "./ens";
import { DaoConstants } from "./types";
import { UNI } from "./uni";

export type DaoConstantsByDaoId = {
    [key in DaoIdEnum]: DaoConstants
}

export enum DaoNameEnum {
    UNI = "Uniswap",
    ENS = "Ethereum Name Service",
  }
  

const daoConstantsByDaoId: DaoConstantsByDaoId = { UNI, ENS }

export default daoConstantsByDaoId