import { createConfig } from "ponder";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { DaoIdEnum } from "@/lib/enums";

import { env } from "@/env";
import { OlasGovernorAbi, OlasTokenAbi } from "@/indexer/olas/abi";

const OLAS_CONTRACTS = CONTRACT_ADDRESSES[DaoIdEnum.OLAS];

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
    OlasToken: {
      abi: OlasTokenAbi,
      chain: "ethereum_mainnet",
      address: OLAS_CONTRACTS.token.address,
      startBlock: OLAS_CONTRACTS.token.startBlock,
    },
    OlasGovernor: {
      abi: OlasGovernorAbi,
      chain: "ethereum_mainnet",
      address: OLAS_CONTRACTS.governor.address,
      startBlock: OLAS_CONTRACTS.governor.startBlock,
    },
  },
});
