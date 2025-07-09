import { DaysEnum } from "./enums";

export function calculateHistoricalBlockNumber(
  days: DaysEnum,
  currentBlockNumber: number,
  blockTime: number,
): number {
  const secondsInPast = days; // DaysEnum values are already in seconds
  const blocksToGoBack = Math.floor(secondsInPast / blockTime);
  const historicalBlockNumber = Math.max(0, currentBlockNumber - blocksToGoBack);

  return historicalBlockNumber;
}