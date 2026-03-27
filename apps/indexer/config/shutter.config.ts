import { createConfig } from "ponder";

import { env } from "@/env";
import {
  TokenAbi,
  AzoriusAbi,
  LinearVotingStrategyAbi,
} from "@/indexer/shu/abi";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { DaoIdEnum } from "@/lib/enums";

const SHUTTER_CONTRACTS = CONTRACT_ADDRESSES[DaoIdEnum.SHU];

export default createConfig({
  database: {
    kind: "postgres",
    connectionString: env.DATABASE_URL,
  },
  chains: {
    ethereum_mainnet: {
      id: 1,
      rpc: env.RPC_URLS[0],
      maxRequestsPerSecond: env.MAX_REQUESTS_PER_SECOND,
      pollingInterval: env.POLLING_INTERVAL,
    },
  },
  contracts: {
    SHUToken: {
      // ABI could also come from the contract address
      abi: TokenAbi,
      chain: "ethereum_mainnet",
      address: SHUTTER_CONTRACTS.token.address,
      startBlock: SHUTTER_CONTRACTS.token.startBlock,
    },
    Azorius: {
      abi: AzoriusAbi,
      chain: "ethereum_mainnet",
      address: SHUTTER_CONTRACTS.azorius.address,
      startBlock: SHUTTER_CONTRACTS.azorius.startBlock,
    },
    LinearVotingStrategy: {
      abi: LinearVotingStrategyAbi,
      chain: "ethereum_mainnet",
      address: SHUTTER_CONTRACTS.linearVotingStrategy.address,
      startBlock: SHUTTER_CONTRACTS.linearVotingStrategy.startBlock,
    },
  },
});
