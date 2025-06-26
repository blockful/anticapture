import { publicClient } from "@/shared/services/wallet/wallet";
import { BlockchainEnum } from "@/shared/types/blockchains";

export const getCurrentBlockNumber = async ({
  blockchain = BlockchainEnum.ETHEREUM,
}: {
  blockchain?: BlockchainEnum;
}) => {
  if (blockchain === BlockchainEnum.ETHEREUM) {
    const blockNumber = await publicClient.getBlockNumber();

    return blockNumber;
  }

  return null;
};
