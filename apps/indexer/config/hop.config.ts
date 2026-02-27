import { createConfig } from "ponder";

import { env } from "@/env";
import { HOPGovernorAbi, HOPTokenAbi } from "@/indexer/hop";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { DaoIdEnum } from "@/lib/enums";

const HOP_CONTRACTS = CONTRACT_ADDRESSES[DaoIdEnum.HOP];

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
    HOPToken: {
      abi: HOPTokenAbi,
      chain: "ethereum_mainnet",
      address: HOP_CONTRACTS.token.address,
      startBlock: HOP_CONTRACTS.token.startBlock,
    },
    HOPGovernor: {
      abi: HOPGovernorAbi,
      chain: "ethereum_mainnet",
      address: HOP_CONTRACTS.governor.address,
      startBlock: HOP_CONTRACTS.governor.startBlock,
    },
  },
});
