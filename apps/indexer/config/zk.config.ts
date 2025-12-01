import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { DaoIdEnum } from "@/lib/enums";
import { env } from "@/env";
import { createConfig } from "ponder";
import { GovernorAbi, TokenAbi } from "@/indexer/zk";

const ZK_CONTRACTS = CONTRACT_ADDRESSES[DaoIdEnum.ZK];

export default createConfig({
  database: {
    kind: "postgres",
    connectionString: env.DATABASE_URL,
  },
  chains: {
    zksync_mainnet: {
      id: 324,
      rpc: env.RPC_URL,
      maxRequestsPerSecond: env.MAX_REQUESTS_PER_SECOND,
      pollingInterval: env.POLLING_INTERVAL,
    },
  },
  contracts: {
    ZKToken: {
      abi: TokenAbi,
      chain: "zksync_mainnet",
      address: ZK_CONTRACTS.token.address,
      startBlock: ZK_CONTRACTS.token.startBlock,
    },
    ZKGovernor: {
      abi: GovernorAbi,
      chain: "zksync_mainnet",
      address: ZK_CONTRACTS.governor.address,
      startBlock: ZK_CONTRACTS.governor.startBlock,
    },
  },
})
