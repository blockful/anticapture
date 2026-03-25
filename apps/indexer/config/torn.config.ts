import { createConfig } from "ponder";

import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { DaoIdEnum } from "@/lib/enums";
import { env } from "@/env";
import { TORNTokenAbi, TORNGovernorAbi } from "@/indexer/torn/abi";

const TORN_CONTRACTS = CONTRACT_ADDRESSES[DaoIdEnum.TORN];

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
    TORNToken: {
      abi: TORNTokenAbi,
      chain: "ethereum_mainnet",
      address: TORN_CONTRACTS.token.address,
      startBlock: TORN_CONTRACTS.token.startBlock,
    },
    TORNGovernor: {
      abi: TORNGovernorAbi,
      chain: "ethereum_mainnet",
      address: TORN_CONTRACTS.governor.address,
      startBlock: TORN_CONTRACTS.governor.startBlock,
    },
  },
});
