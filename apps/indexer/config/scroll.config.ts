import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { DaoIdEnum } from "@/lib/enums";
import { env } from "@/env";
import { createConfig } from "ponder";
import { SCRGovernorAbi, SCRTokenAbi } from "@/indexer/scr/abi";

const SCR_CONTRACTS = CONTRACT_ADDRESSES[DaoIdEnum.SCR];

export default createConfig({
  database: {
    kind: "postgres",
    connectionString: env.DATABASE_URL,
  },
  chains: {
    scroll_mainnet: {
      id: 534352,
      rpc: env.RPC_URL,
      maxRequestsPerSecond: env.MAX_REQUESTS_PER_SECOND,
      pollingInterval: env.POLLING_INTERVAL,
    },
  },
  contracts: {
    SCRToken: {
      abi: SCRTokenAbi,
      chain: "scroll_mainnet",
      address: SCR_CONTRACTS.token.address,
      startBlock: SCR_CONTRACTS.token.startBlock,
    },
    SCRGovernor: {
      abi: SCRGovernorAbi,
      chain: "scroll_mainnet",
      address: SCR_CONTRACTS.governor.address,
      startBlock: SCR_CONTRACTS.governor.startBlock,
    },
  },
})
