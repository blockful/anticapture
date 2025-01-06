import { Address, zeroAddress } from "viem";

export enum DaoName {
  UNISWAP = "UNI",
  ENS = "ENS",
}

export const SUPPORTED_DAO_NAMES = Object.values(DaoName);

export interface DAO {
  id: DaoName;
  quorum: number;
  proposalThreshold: number;
  votingDelay: number;
  votingPeriod: number;
  timelockDelay: number;
  totalSupply: number;
}

export const TokenContract: Record<DaoName, Address> = {
  [DaoName.UNISWAP]: "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",
  [DaoName.ENS]: zeroAddress,
};
