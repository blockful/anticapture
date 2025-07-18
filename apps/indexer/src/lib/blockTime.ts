import { DaysEnum } from "./enums";

export function calculateHistoricalBlockNumber(
  days: DaysEnum,
  currentBlockNumber: number,
  blockTime: number,
): number {
  const blocksToGoBack = Math.floor(days / blockTime);
  const historicalBlockNumber = Math.max(0, currentBlockNumber - blocksToGoBack);

  return historicalBlockNumber;
}