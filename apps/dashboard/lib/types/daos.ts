import { Address, zeroAddress } from "viem";

export enum DaoId {
  UNISWAP = "UNI",
  ENS = "ENS",
}

export const SUPPORTED_DAO_NAMES = Object.values(DaoId);

export interface DAO {
  id: DaoId;
  quorum: number;
  proposalThreshold: number;
  votingDelay: number;
  votingPeriod: number;
  timelockDelay: number;
  totalSupply: number;
}

export const TokenContract: Record<DaoId, Address> = {
  [DaoId.UNISWAP]: "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",
  [DaoId.ENS]: zeroAddress,
};
