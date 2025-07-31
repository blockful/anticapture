import { DaysEnum } from "./enums";

export function calculateTimeDifference(days: DaysEnum): number {
  const currentTimestamp = Math.floor(Date.now() / 1000);
  return currentTimestamp - days;
}

export function calculateHistoricalBlockNumber(
  days: DaysEnum,
  currentBlockNumber: number,
  blockTime: number,
): number {
  const blocksToGoBack = Math.floor(days / blockTime);
  const historicalBlockNumber = Math.max(
    0,
    currentBlockNumber - blocksToGoBack,
  );

  return historicalBlockNumber;
}
