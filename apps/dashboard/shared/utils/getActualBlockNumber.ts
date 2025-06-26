import { publicClient } from "@/shared/services/wallet/wallet";

export const getEthereumCurrentBlockNumber = async (): Promise<bigint> => {
  const blockNumber = await publicClient.getBlockNumber();
  return blockNumber;
};
