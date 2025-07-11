import { createConfig } from "ponder";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { DaoIdEnum } from "@/lib/enums";

import { env } from "@/env";
import { GovernorAbi, TokenAbi } from "@/indexer/op";

const OP_CONTRACTS = CONTRACT_ADDRESSES[DaoIdEnum.OP];

export default createConfig({
  database: {
    kind: "postgres",
    connectionString: env.DATABASE_URL,
  },
  chains: {
    optimism_mainnet: {
      id: 42161,
      rpc: env.RPC_URL,
      maxRequestsPerSecond: env.MAX_REQUESTS_PER_SECOND,
      pollingInterval: env.POLLING_INTERVAL,
    },
  },
  contracts: {
    OPToken: {
      abi: TokenAbi,
      chain: "optimism_mainnet",
      address: OP_CONTRACTS.token.address,
      startBlock: OP_CONTRACTS.token.startBlock,
    },
    OPGovernor: {
      abi: GovernorAbi,
      chain: "optimism_mainnet",
      address: OP_CONTRACTS.governor.address,
      startBlock: OP_CONTRACTS.governor.startBlock,
    },
  },
});
