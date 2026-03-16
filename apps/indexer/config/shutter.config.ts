import { createConfig } from "ponder";

import { env } from "@/env";
import {
  SHUTokenAbi,
  AzoriusAbi,
  LinearERC20VotingAbi,
} from "@/indexer/shu/abi";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { DaoIdEnum } from "@/lib/enums";

const SHU_CONTRACTS = CONTRACT_ADDRESSES[DaoIdEnum.SHU];

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
    SHUToken: {
      abi: SHUTokenAbi,
      chain: "ethereum_mainnet",
      address: SHU_CONTRACTS.token.address,
      startBlock: SHU_CONTRACTS.token.startBlock,
    },
    ShutterAzorius: {
      abi: AzoriusAbi,
      chain: "ethereum_mainnet",
      address: SHU_CONTRACTS.azorius.address,
      startBlock: SHU_CONTRACTS.azorius.startBlock,
    },
    ShutterLinearVoting: {
      abi: LinearERC20VotingAbi,
      chain: "ethereum_mainnet",
      address: SHU_CONTRACTS.linearVoting.address,
      startBlock: SHU_CONTRACTS.linearVoting.startBlock,
    },
  },
});
