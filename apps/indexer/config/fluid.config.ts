import { createConfig } from "ponder";

import { env } from "@/env";
import { FLUIDGovernorAbi, FLUIDTokenAbi } from "@/indexer/fluid";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { DaoIdEnum } from "@/lib/enums";

const FLUID_CONTRACTS = CONTRACT_ADDRESSES[DaoIdEnum.FLUID];

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
    FLUIDToken: {
      abi: FLUIDTokenAbi,
      chain: "ethereum_mainnet",
      address: FLUID_CONTRACTS.token.address,
      startBlock: FLUID_CONTRACTS.token.startBlock,
    },
    FLUIDGovernor: {
      abi: FLUIDGovernorAbi,
      chain: "ethereum_mainnet",
      address: FLUID_CONTRACTS.governor.address,
      startBlock: FLUID_CONTRACTS.governor.startBlock,
    },
  },
});
