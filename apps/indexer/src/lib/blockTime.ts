import { DaoIdEnum } from "./enums";
import { DaysEnum } from "./daysEnum";
import { CONTRACT_ADDRESSES } from "./constants";
import { env } from "@/env";

export function calculateHistoricalBlockNumber(
  days: DaysEnum,
  currentBlockNumber: number,
  daoId: DaoIdEnum
): number {
  const { NETWORK: network } = env;
  const contractInfo = CONTRACT_ADDRESSES[network]?.[daoId];
  
  if (!contractInfo) {
    throw new Error(`No contract configuration found for DAO: ${daoId} on network: ${network}`);
  }

  const blockTime = contractInfo.blockTime;
  if (blockTime === undefined) {
    throw new Error(`No block time configuration found for DAO: ${daoId} on network: ${network}`);
  }

  const secondsInPast = days; // DaysEnum values are already in seconds
  const blocksToGoBack = Math.floor(secondsInPast / blockTime);
  const historicalBlockNumber = Math.max(0, currentBlockNumber - blocksToGoBack);

  return historicalBlockNumber;
}