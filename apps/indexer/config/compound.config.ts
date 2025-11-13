import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { DaoIdEnum } from "@/lib/enums";
import { env } from "@/env";
import { createConfig } from "ponder";
import { COMPGovernorAbi, COMPTokenAbi } from "@/indexer/comp";

const COMP_CONTRACTS = CONTRACT_ADDRESSES[DaoIdEnum.COMP];

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
    COMPToken: {
      abi: COMPTokenAbi,
      chain: "ethereum_mainnet",
      address: COMP_CONTRACTS.token.address,
      startBlock: COMP_CONTRACTS.token.startBlock,
    },
    COMPGovernor: {
      abi: COMPGovernorAbi,
      chain: "ethereum_mainnet",
      address: COMP_CONTRACTS.governor.address,
      startBlock: COMP_CONTRACTS.governor.startBlock,
    },
  },
})
