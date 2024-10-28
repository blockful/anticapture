import { createPublicClient, http } from "viem";
import { ViemConfig } from "../../config";

const publicClient = (viemConfig: ViemConfig) => {
  const publicClient = createPublicClient({
    chain: viemConfig.chain,
    transport: http(viemConfig.url),
  });
  return publicClient;
};
