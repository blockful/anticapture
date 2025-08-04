import { createConfig } from "ponder";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { DaoIdEnum } from "@/lib/enums";

import { env } from "@/env";
import { SHUTokenAbi, LinearVotingStrategyAbi, AzoriusAbi } from "@/indexer/shutter/abi";

const SHU_CONTRACTS = CONTRACT_ADDRESSES[DaoIdEnum.SHU];

export default createConfig({
  database: {
    kind: "postgres",
    connectionString: env.DATABASE_URL,
  },
  chains: {
    ethereum_mainnet: {
      id: 1,
      rpc: env.RPC_URL,
      maxRequestsPerSecond: env.MAX_REQUESTS_PER_SECOND,
      pollingInterval: env.POLLING_INTERVAL,
    },
  },
  contracts: {
    SHUToken: {
      // ABI could also come from the contract address
      abi: SHUTokenAbi,
      chain: "ethereum_mainnet",
      address: SHU_CONTRACTS.token.address,
      startBlock: SHU_CONTRACTS.token.startBlock,
    },
    Azorius: {
      abi: AzoriusAbi,
      chain: "ethereum_mainnet",
      address: SHU_CONTRACTS.azorius.address,
      startBlock: SHU_CONTRACTS.azorius.startBlock,
    },
    LinearVotingStrategy: {
      abi: LinearVotingStrategyAbi,
      chain: "ethereum_mainnet",
      address: SHU_CONTRACTS.linearVotingStrategy.address,
      startBlock: SHU_CONTRACTS.linearVotingStrategy.startBlock,
    },
  },
});

