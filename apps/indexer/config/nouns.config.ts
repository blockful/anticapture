import { createConfig, mergeAbis } from "ponder";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { DaoIdEnum } from "@/lib/enums";

import { env } from "@/env";
import {
  GovernorAbi,
  TokenAbi,
  LegacyGovernorABI,
  AuctionAbi,
} from "@/indexer/nouns/abi";

const NOUNS_CONTRACTS = CONTRACT_ADDRESSES[DaoIdEnum.NOUNS];

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
    NounsGovernor: {
      abi: mergeAbis([GovernorAbi, LegacyGovernorABI]),
      chain: "ethereum_mainnet",
      address: NOUNS_CONTRACTS.governor.address,
      startBlock: NOUNS_CONTRACTS.governor.startBlock,
    },
    NounsToken: {
      abi: TokenAbi,
      chain: "ethereum_mainnet",
      address: NOUNS_CONTRACTS.token.address,
      startBlock: NOUNS_CONTRACTS.token.startBlock,
    },
    NounsAuction: {
      abi: AuctionAbi,
      chain: "ethereum_mainnet",
      address: NOUNS_CONTRACTS.auction.address,
      startBlock: NOUNS_CONTRACTS.auction.startBlock,
    },
  },
});
