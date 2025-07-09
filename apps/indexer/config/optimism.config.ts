import { createConfig } from "ponder";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { DaoIdEnum, NetworkEnum } from "@/lib/enums";

import { env } from "@/env";
import { ARBTokenAbi } from "@/indexer/arb";

const OP_CONTRACTS = CONTRACT_ADDRESSES[NetworkEnum.OPTIMISM][DaoIdEnum.OP]!;

export default createConfig({
  database: {
    kind: "postgres",
    connectionString: env.DATABASE_URL,
  },
  chains: {
    optimism_mainnet: {
      id: 10,
      rpc: env.RPC_URL,
      maxRequestsPerSecond: env.MAX_REQUESTS_PER_SECOND,
      pollingInterval: env.POLLING_INTERVAL,
    },
  },
  contracts: {
    ARBToken: {
      abi: ARBTokenAbi,
      chain: "optimism_mainnet",
      address: OP_CONTRACTS.token.address,
      startBlock: OP_CONTRACTS.token.startBlock,
    },
  },
});
