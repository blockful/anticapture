import { createConfig } from "ponder";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { DaoIdEnum } from "@/lib/enums";

import { env } from "@/env";
import { ObolGovernorAbi, ObolTokenAbi } from "@/indexer/obol/abi";

const OBOL_CONTRACTS = CONTRACT_ADDRESSES[DaoIdEnum.OBOL];

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
    ObolToken: {
      abi: ObolTokenAbi,
      chain: "ethereum_mainnet",
      address: OBOL_CONTRACTS.token.address,
      startBlock: OBOL_CONTRACTS.token.startBlock,
    },
    ObolGovernor: {
      abi: ObolGovernorAbi,
      chain: "ethereum_mainnet",
      address: OBOL_CONTRACTS.governor.address,
      startBlock: OBOL_CONTRACTS.governor.startBlock,
    },
  },
});
