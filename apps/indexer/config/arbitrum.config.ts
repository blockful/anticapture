import { createConfig } from "ponder";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { DaoIdEnum } from "@/lib/enums";

import { env } from "@/env";
import {
  ARBTokenAbi,
  // GovernorAbi, // Commented: ARBGovernor disabled
  GovernorTreasuryAbi,
} from "@/indexer/arb";

const ARB_CONTRACTS = CONTRACT_ADDRESSES[DaoIdEnum.ARB];

export default createConfig({
  database: {
    kind: "postgres",
    connectionString: env.DATABASE_URL,
  },
  chains: {
    arbitrum_mainnet: {
      id: 42161,
      rpc: env.RPC_URL,
      maxRequestsPerSecond: env.MAX_REQUESTS_PER_SECOND,
      pollingInterval: env.POLLING_INTERVAL,
    },
  },
  contracts: {
    ARBToken: {
      abi: ARBTokenAbi,
      chain: "arbitrum_mainnet",
      address: ARB_CONTRACTS.token.address,
      startBlock: ARB_CONTRACTS.token.startBlock,
    },
    // ARBGovernor: {
    //   abi: GovernorAbi,
    //   chain: "arbitrum_mainnet",
    //   address: ARB_CONTRACTS.governor.address,
    //   startBlock: ARB_CONTRACTS.governor.startBlock,
    // },
    ARBGovernorTreasury: {
      abi: GovernorTreasuryAbi,
      chain: "arbitrum_mainnet",
      address: ARB_CONTRACTS.governorTreasury.address,
      startBlock: ARB_CONTRACTS.governorTreasury.startBlock,
    },
  },
});
