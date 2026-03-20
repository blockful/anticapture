import { createConfig, mergeAbis } from "ponder";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { DaoIdEnum } from "@/lib/enums";

import { env } from "@/env";
import {
  GovernorAbi,
  TokenAbi,
  LegacyGovernorABI,
} from "@/indexer/lilnouns/abi";

const LIL_NOUNS_CONTRACTS = CONTRACT_ADDRESSES[DaoIdEnum.LIL_NOUNS];

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
    LilNounsGovernor: {
      abi: mergeAbis([GovernorAbi, LegacyGovernorABI]),
      chain: "ethereum_mainnet",
      address: LIL_NOUNS_CONTRACTS.governor.address,
      startBlock: LIL_NOUNS_CONTRACTS.governor.startBlock,
    },
    LilNounsToken: {
      abi: TokenAbi,
      chain: "ethereum_mainnet",
      address: LIL_NOUNS_CONTRACTS.token.address,
      startBlock: LIL_NOUNS_CONTRACTS.token.startBlock,
    },
  },
});
