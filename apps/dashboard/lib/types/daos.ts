import { Address, zeroAddress } from "viem";

export enum DaoIdEnum {
  UNISWAP = "UNI",
  // ENS = "ENS",
}

export enum DaoNameEnum {
  UNI = "Uniswap",
  ENS = "Ethereum Name Service",
}

export const daoIdToNameMap: Record<DaoIdEnum, DaoNameEnum> = {
  [DaoIdEnum.UNISWAP]: DaoNameEnum.UNI,
  // [DaoId.ENS]: DaoName.ENS,
};

export const SUPPORTED_DAO_NAMES = Object.values(DaoIdEnum);

export interface DAO {
  id: DaoIdEnum;
  quorum: number;
  proposalThreshold: number;
  votingDelay: number;
  votingPeriod: number;
  timelockDelay: number;
  totalSupply: number;
}

export const TokenContract: Record<DaoIdEnum, Address> = {
  [DaoIdEnum.UNISWAP]: "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",
  // [DaoId.ENS]: zeroAddress,
};
