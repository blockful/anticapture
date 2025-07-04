import { ETHEREUM_BLOCK_TIME_SECONDS } from "@/shared/types/blockchains";
import { getEthereumCurrentBlockNumber } from "@/shared/utils/getActualBlockNumber";
import { TimeInterval } from "@/shared/types/enums/TimeInterval";
import { DAYS_IN_SECONDS } from "@/shared/constants/time-related";

const calculateBlocksForPeriod = (period: TimeInterval): bigint => {
  const seconds = BigInt(DAYS_IN_SECONDS[period]);
  const blockTime = BigInt(ETHEREUM_BLOCK_TIME_SECONDS);
  return BigInt(Math.floor(Number(seconds) / Number(blockTime)));
};

export const getHistoricalBlockNumber = async ({
  period,
}: {
  period: TimeInterval;
}): Promise<number> => {
  const currentBlock = await getEthereumCurrentBlockNumber();
  if (currentBlock == null) {
    throw new Error("Could not get the current block");
  }

  const blocksAgo = calculateBlocksForPeriod(period);

  const histBlockBigInt = currentBlock - blocksAgo;

  const safeHist = histBlockBigInt > 1n ? histBlockBigInt : 1n;

  return Number(safeHist);
};
