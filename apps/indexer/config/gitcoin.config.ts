import { createConfig } from "ponder";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { DaoIdEnum } from "@/lib/enums";

import { env } from "@/env";
import { GovernorAbi, TokenAbi } from "@/indexer/gtc/abi";

const GTC_CONTRACTS = CONTRACT_ADDRESSES[DaoIdEnum.GTC];

export default createConfig({
  chains: {
    ethereum_mainnet: {
      id: 1,
      rpc: env.RPC_URL,
      maxRequestsPerSecond: env.MAX_REQUESTS_PER_SECOND,
      pollingInterval: env.POLLING_INTERVAL,
    },
  },
  contracts: {
    GTCGovernor: {
      abi: GovernorAbi,
      chain: "ethereum_mainnet",
      address: GTC_CONTRACTS.governor.address,
      startBlock: GTC_CONTRACTS.governor.startBlock,
    },
    GTCToken: {
      abi: TokenAbi,
      chain: "ethereum_mainnet",
      address: GTC_CONTRACTS.token.address,
      startBlock: GTC_CONTRACTS.token.startBlock,
    },
  },
});
